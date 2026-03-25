import { useState, useCallback } from "react";
import { webllmEngine } from "@/lib/webllm-engine";
import { useWebLLMStatus } from "@/lib/hooks";
import {
  AUTOMATION_TEMPLATES,
  type AutomationTemplate,
} from "@/lib/automation-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Mail,
  Code,
  Lightbulb,
  Languages,
  GraduationCap,
  ListChecks,
  PenLine,
  BarChart3,
  Bug,
  BookOpen,
  Shield,
  Play,
  Loader2,
  Square,
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  FileText,
  Mail,
  Code,
  Lightbulb,
  Languages,
  GraduationCap,
  ListChecks,
  PenLine,
  BarChart3,
  Bug,
  BookOpen,
  Shield,
};

const CATEGORY_COLORS: Record<string, string> = {
  writing: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  productivity: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  coding: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
  analysis: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  creative: "text-pink-600 dark:text-pink-400 bg-pink-500/10",
};

export default function AutomationsPage() {
  const { status } = useWebLLMStatus();
  const [activeTemplate, setActiveTemplate] = useState<AutomationTemplate | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const modelReady = status === "ready";

  const handleRun = useCallback(async () => {
    if (!input.trim() || !activeTemplate || !modelReady) return;

    setIsRunning(true);
    setOutput("");

    const messages = [
      { role: "system", content: activeTemplate.systemPrompt },
      { role: "user", content: input.trim() },
    ];

    await webllmEngine.generate(messages, {
      onToken: (_token, fullText) => {
        setOutput(fullText);
      },
      onComplete: (fullText) => {
        setOutput(fullText);
        setIsRunning(false);
      },
      onError: (error) => {
        setOutput(`Error: ${error}`);
        setIsRunning(false);
      },
    });
  }, [input, activeTemplate, modelReady]);

  const categories = ["productivity", "writing", "coding", "analysis", "creative"];
  const filtered = AUTOMATION_TEMPLATES.filter(
    (t) => !filterCategory || t.category === filterCategory
  );

  // Template detail / run view
  if (activeTemplate) {
    const IconComponent = ICON_MAP[activeTemplate.icon] || Sparkles;

    return (
      <div className="flex flex-col h-full" data-testid="automation-run">
        <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setActiveTemplate(null);
                setOutput("");
                setInput("");
              }}
              className="h-8 w-8 p-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <IconComponent className="w-4 h-4 text-primary" />
            <h1 className="text-base font-semibold">{activeTemplate.name}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-10">
            {activeTemplate.description}
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Input */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Input
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Enter text for ${activeTemplate.name.toLowerCase()}...`}
                rows={5}
                className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                data-testid="input-automation"
              />
            </div>

            {/* Run Button */}
            <div className="flex gap-2">
              {isRunning ? (
                <Button
                  variant="destructive"
                  onClick={() => webllmEngine.stopGeneration()}
                  className="flex-1"
                  data-testid="button-stop-automation"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={handleRun}
                  disabled={!input.trim() || !modelReady}
                  className="flex-1"
                  data-testid="button-run-automation"
                >
                  {!modelReady ? (
                    <>Load a model first</>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Output */}
            {(output || isRunning) && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                  Output
                  {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
                </label>
                <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[120px]">
                  {output || (
                    <span className="text-muted-foreground">Generating...</span>
                  )}
                  {isRunning && (
                    <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Template grid view
  return (
    <div className="flex flex-col h-full" data-testid="automations-page">
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold mb-1">Automations</h1>
        <p className="text-xs text-muted-foreground">
          Pre-built prompt templates for common tasks. Select one, provide your
          input, and let the local model handle the rest.
        </p>
      </div>

      {/* Category Filters */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              !filterCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
            data-testid="button-filter-all"
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setFilterCategory(filterCategory === cat ? null : cat)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize shrink-0 ${
                filterCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
              data-testid={`button-filter-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {!modelReady && (
        <div className="mx-4 mt-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300">
            Load a model from the Models tab to use automations.
          </span>
        </div>
      )}

      <ScrollArea className="flex-1 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 pt-2">
          {filtered.map((tmpl) => {
            const IconComponent = ICON_MAP[tmpl.icon] || Sparkles;
            const catColor = CATEGORY_COLORS[tmpl.category] || "";

            return (
              <button
                key={tmpl.id}
                onClick={() => setActiveTemplate(tmpl)}
                className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors group"
                data-testid={`automation-card-${tmpl.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <IconComponent className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium">{tmpl.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tmpl.description}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-2 capitalize ${catColor}`}
                    >
                      {tmpl.category}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
