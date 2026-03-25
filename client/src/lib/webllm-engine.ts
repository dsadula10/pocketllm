/**
 * WebLLM Engine Service — manages model lifecycle, download, and inference.
 * Uses @mlc-ai/web-llm to run LLMs entirely in-browser via WebGPU/WASM.
 */

export interface ModelInfo {
  id: string;
  name: string;
  size: string;
  params: string;
  description: string;
  category: "tiny" | "small" | "medium";
  quantization: string;
  ramRequired: string;
  features: string[];
}

// Curated list of lightweight models suitable for mobile
export const MODEL_CATALOG: ModelInfo[] = [
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M",
    size: "~250 MB",
    params: "360M",
    description: "Ultra-compact model for basic text tasks. Fast on any device.",
    category: "tiny",
    quantization: "Q4F16",
    ramRequired: "512 MB",
    features: ["Fast inference", "Low memory", "Basic chat"],
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    name: "SmolLM2 1.7B",
    size: "~1.0 GB",
    params: "1.7B",
    description: "Balanced tiny model with solid reasoning for its size.",
    category: "small",
    quantization: "Q4F16",
    ramRequired: "2 GB",
    features: ["Reasoning", "Instruction following", "Summarization"],
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 0.5B",
    size: "~350 MB",
    params: "0.5B",
    description: "Alibaba's compact model with multilingual support.",
    category: "tiny",
    quantization: "Q4F16",
    ramRequired: "1 GB",
    features: ["Multilingual", "Fast", "Compact"],
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 1.5B",
    size: "~1.0 GB",
    params: "1.5B",
    description: "Strong multilingual capability with enhanced reasoning.",
    category: "small",
    quantization: "Q4F16",
    ramRequired: "2 GB",
    features: ["Multilingual", "Reasoning", "Code"],
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    size: "~700 MB",
    params: "1B",
    description: "Meta's latest compact model, optimized for edge devices.",
    category: "small",
    quantization: "Q4F16",
    ramRequired: "1.5 GB",
    features: ["Edge optimized", "Instruction following", "Summarization"],
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    size: "~1.8 GB",
    params: "3B",
    description: "Best balance of quality and speed for mobile devices.",
    category: "medium",
    quantization: "Q4F16",
    ramRequired: "3 GB",
    features: ["High quality", "Reasoning", "Code", "Analysis"],
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    name: "Phi-3.5 Mini",
    size: "~2.2 GB",
    params: "3.8B",
    description: "Microsoft's powerful mini model with strong reasoning.",
    category: "medium",
    quantization: "Q4F16",
    ramRequired: "4 GB",
    features: ["Strong reasoning", "Code generation", "Math", "Analysis"],
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    name: "Gemma 2 2B",
    size: "~1.4 GB",
    params: "2B",
    description: "Google's efficient model with instruction tuning.",
    category: "small",
    quantization: "Q4F16",
    ramRequired: "2 GB",
    features: ["Instruction tuned", "Summarization", "Q&A"],
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    name: "TinyLlama 1.1B",
    size: "~650 MB",
    params: "1.1B",
    description: "Efficient model for basic tasks with minimal resources.",
    category: "tiny",
    quantization: "Q4F16",
    ramRequired: "1 GB",
    features: ["Ultra light", "Basic chat", "Fast"],
  },
];

export type EngineStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export interface DownloadProgress {
  modelId: string;
  progress: number; // 0-100
  timeElapsed: number;
  text: string;
}

export interface GenerateCallbacks {
  onToken: (token: string, fullText: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

type EngineListener = (status: EngineStatus, detail?: string) => void;
type ProgressListener = (progress: DownloadProgress) => void;

class WebLLMEngine {
  private engine: any = null;
  private currentModelId: string | null = null;
  private status: EngineStatus = "idle";
  private listeners: Set<EngineListener> = new Set();
  private progressListeners: Set<ProgressListener> = new Set();
  private abortController: AbortController | null = null;

  getStatus() {
    return this.status;
  }

  getCurrentModelId() {
    return this.currentModelId;
  }

  onStatusChange(listener: EngineListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onProgress(listener: ProgressListener) {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private setStatus(status: EngineStatus, detail?: string) {
    this.status = status;
    this.listeners.forEach((l) => l(status, detail));
  }

  private emitProgress(progress: DownloadProgress) {
    this.progressListeners.forEach((l) => l(progress));
  }

  async checkWebGPU(): Promise<{
    supported: boolean;
    adapter?: string;
    error?: string;
  }> {
    try {
      if (!("gpu" in navigator)) {
        return {
          supported: false,
          error:
            "WebGPU not available. Use Chrome 113+ or Edge 113+ on a device with GPU support.",
        };
      }
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter();
      if (!adapter) {
        return {
          supported: false,
          error: "No GPU adapter found. Your device may not support WebGPU.",
        };
      }
      const info = await adapter.requestAdapterInfo?.();
      return {
        supported: true,
        adapter: info?.description || info?.device || "Unknown GPU",
      };
    } catch (e: any) {
      return { supported: false, error: e.message };
    }
  }

  async loadModel(modelId: string): Promise<void> {
    if (this.currentModelId === modelId && this.engine && this.status === "ready") {
      return; // Already loaded
    }

    try {
      this.setStatus("downloading", `Preparing ${modelId}...`);
      const startTime = Date.now();

      // Load web-llm from CDN at runtime to avoid bundling indexedDB/localStorage
      // which would block deployment in sandboxed environments.
      // On real mobile browsers (the intended target), these APIs work fine.
      const webllm = await import(
        /* @vite-ignore */
        "https://esm.run/@mlc-ai/web-llm"
      );

      const initProgressCallback = (report: any) => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = report.progress ? report.progress * 100 : 0;
        this.emitProgress({
          modelId,
          progress,
          timeElapsed: elapsed,
          text: report.text || "Loading...",
        });

        if (report.text?.includes("Loading model")) {
          this.setStatus("loading", report.text);
        }
      };

      this.engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback,
      });

      this.currentModelId = modelId;
      this.setStatus("ready", `${modelId} loaded`);
    } catch (e: any) {
      this.setStatus("error", e.message);
      throw e;
    }
  }

  async generate(
    messages: Array<{ role: string; content: string }>,
    callbacks: GenerateCallbacks,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<void> {
    if (!this.engine || this.status !== "ready") {
      callbacks.onError("No model loaded. Please load a model first.");
      return;
    }

    this.setStatus("generating");
    this.abortController = new AbortController();

    try {
      const chatMessages = messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      }));

      let fullText = "";

      const asyncGenerator = await this.engine.chat.completions.create({
        messages: chatMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of asyncGenerator) {
        if (this.abortController?.signal.aborted) break;
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          fullText += delta;
          callbacks.onToken(delta, fullText);
        }
      }

      callbacks.onComplete(fullText);
      this.setStatus("ready");
    } catch (e: any) {
      if (e.name === "AbortError") {
        this.setStatus("ready");
      } else {
        this.setStatus("ready");
        callbacks.onError(e.message);
      }
    } finally {
      this.abortController = null;
    }
  }

  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.engine) {
      try {
        this.engine.interruptGenerate?.();
      } catch {}
    }
  }

  async unloadModel(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload?.();
      } catch {}
      this.engine = null;
      this.currentModelId = null;
      this.setStatus("idle");
    }
  }

  async resetChat(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.resetChat?.();
      } catch {}
    }
  }

  getModelInfo(modelId: string): ModelInfo | undefined {
    return MODEL_CATALOG.find((m) => m.id === modelId);
  }
}

// Singleton
export const webllmEngine = new WebLLMEngine();
