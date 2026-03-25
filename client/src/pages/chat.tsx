import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { webllmEngine, MODEL_CATALOG } from "@/lib/webllm-engine";
import { useWebLLMStatus, useAutoResize } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Square,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
  Cpu,
} from "lucide-react";
import type { Conversation, Message } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  id?: number;
}

export default function ChatPage() {
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoResize = useAutoResize(textareaRef);
  const { status, currentModelId } = useWebLLMStatus();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const createConv = useMutation({
    mutationFn: async (modelId: string) => {
      const res = await apiRequest("POST", "/api/conversations", {
        title: "New Chat",
        modelId,
      });
      return res.json();
    },
    onSuccess: (conv: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setActiveConvId(conv.id);
      setChatMessages([]);
    },
  });

  const deleteConv = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (activeConvId) {
        setActiveConvId(null);
        setChatMessages([]);
      }
    },
  });

  const saveMessage = useMutation({
    mutationFn: async (msg: {
      conversationId: number;
      role: string;
      content: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/conversations/${msg.conversationId}/messages`,
        { role: msg.role, content: msg.content, timestamp: Date.now() }
      );
      return res.json();
    },
  });

  const updateTitle = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/conversations/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Load messages when switching conversations
  useEffect(() => {
    if (activeConvId) {
      apiRequest("GET", `/api/conversations/${activeConvId}/messages`)
        .then((r) => r.json())
        .then((msgs: Message[]) => {
          setChatMessages(
            msgs.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              id: m.id,
            }))
          );
        });
    }
  }, [activeConvId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, streamingText]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const modelId = currentModelId;
    if (!modelId || status !== "ready") return;

    const userMessage = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Create conversation if none active
    let convId = activeConvId;
    if (!convId) {
      const conv = await createConv.mutateAsync(modelId);
      convId = conv.id;
    }

    // Add user message
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];
    setChatMessages(newMessages);

    // Save user message
    saveMessage.mutate({
      conversationId: convId!,
      role: "user",
      content: userMessage,
    });

    // Auto-title on first message
    if (chatMessages.length === 0) {
      const title =
        userMessage.length > 40
          ? userMessage.substring(0, 40) + "..."
          : userMessage;
      updateTitle.mutate({ id: convId!, title });
    }

    // Generate response
    setIsStreaming(true);
    setStreamingText("");

    const allMessages = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await webllmEngine.generate(allMessages, {
      onToken: (_token, fullText) => {
        setStreamingText(fullText);
      },
      onComplete: (fullText) => {
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: fullText,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        setStreamingText("");
        setIsStreaming(false);

        // Save assistant message
        saveMessage.mutate({
          conversationId: convId!,
          role: "assistant",
          content: fullText,
        });
      },
      onError: (error) => {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${error}`,
          },
        ]);
        setStreamingText("");
        setIsStreaming(false);
      },
    });
  }, [
    input,
    isStreaming,
    currentModelId,
    status,
    activeConvId,
    chatMessages,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modelReady = status === "ready";
  const modelInfo = currentModelId
    ? MODEL_CATALOG.find((m) => m.id === currentModelId)
    : null;

  return (
    <div className="flex h-full" data-testid="chat-page">
      {/* Conversation Sidebar (mobile: overlay) */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-30 w-72 h-full border-r border-border bg-sidebar transition-transform duration-200 flex flex-col`}
      >
        <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
          <span className="text-sm font-semibold text-sidebar-foreground">Chats</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveConvId(null);
              setChatMessages([]);
              setShowSidebar(false);
            }}
            disabled={!modelReady}
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                No conversations yet
              </p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  activeConvId === c.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => {
                  setActiveConvId(c.id);
                  setShowSidebar(false);
                }}
                data-testid={`conv-item-${c.id}`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <span className="truncate flex-1">{c.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConv.mutate(c.id);
                  }}
                  data-testid={`button-delete-conv-${c.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Backdrop for mobile sidebar */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Chat Header */}
        <div className="h-13 px-4 border-b border-border flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="md:hidden h-8 w-8 p-0"
            onClick={() => setShowSidebar(true)}
            data-testid="button-toggle-sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Cpu className="w-4 h-4 text-primary shrink-0" />
            {modelInfo ? (
              <span className="text-sm font-medium truncate">
                {modelInfo.name}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                No model loaded
              </span>
            )}
            {modelReady && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Ready
              </Badge>
            )}
            {status === "generating" && (
              <Badge className="text-xs shrink-0 bg-primary/10 text-primary border-0">
                Generating
              </Badge>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!modelReady && chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">PocketLLM</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                {status === "idle"
                  ? "Load a model from the Models tab to start chatting. All inference runs locally on your device."
                  : status === "downloading" || status === "loading"
                  ? "Model is loading... This may take a moment on first download."
                  : status === "error"
                  ? "Failed to load model. Check the Models tab."
                  : "Getting ready..."}
              </p>
              {(status === "downloading" || status === "loading") && (
                <Loader2 className="w-5 h-5 animate-spin text-primary mt-4" />
              )}
            </div>
          ) : chatMessages.length === 0 && modelReady ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {modelInfo?.name || "Model Ready"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Running completely on your device. Ask anything — your data
                never leaves this phone.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                {[
                  "Explain quantum computing simply",
                  "Write a haiku about coding",
                  "What are design patterns?",
                  "Help me brainstorm app ideas",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    className="text-left text-xs p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    data-testid={`button-prompt-${prompt.slice(0, 10)}`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 animate-message-in ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-card-border rounded-bl-md"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming response */}
              {streamingText && (
                <div className="flex gap-3 animate-message-in">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed bg-card border border-card-border">
                    <div className="whitespace-pre-wrap break-words">
                      {streamingText}
                      <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator when generating but no text yet */}
              {isStreaming && !streamingText && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-md bg-card border border-card-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground typing-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground typing-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground typing-dot" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  modelReady
                    ? "Message PocketLLM..."
                    : "Load a model to start chatting..."
                }
                disabled={!modelReady}
                rows={1}
                className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 placeholder:text-muted-foreground"
                data-testid="input-chat"
              />
            </div>
            {isStreaming ? (
              <Button
                size="icon"
                variant="destructive"
                className="h-10 w-10 rounded-xl shrink-0"
                onClick={() => webllmEngine.stopGeneration()}
                data-testid="button-stop"
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || !modelReady}
                data-testid="button-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            All processing happens locally on your device. No data sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
