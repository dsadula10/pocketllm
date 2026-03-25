import { useState, useEffect } from "react";
import { webllmEngine, MODEL_CATALOG } from "@/lib/webllm-engine";
import { useWebLLMStatus, useTheme } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Cpu,
  Moon,
  Sun,
  Smartphone,
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Github,
  Heart,
  Shield,
  Globe,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const { status, currentModelId } = useWebLLMStatus();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [gpuInfo, setGpuInfo] = useState<{
    supported: boolean;
    adapter?: string;
    error?: string;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    webllmEngine.checkWebGPU().then(setGpuInfo);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const currentModel = currentModelId
    ? MODEL_CATALOG.find((m) => m.id === currentModelId)
    : null;

  return (
    <div className="flex flex-col h-full" data-testid="settings-page">
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold mb-1">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Device capabilities, preferences, and app info.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Device Status */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Device Status
            </h2>
            <div className="space-y-3">
              {/* WebGPU */}
              <div className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">WebGPU</p>
                      <p className="text-xs text-muted-foreground">
                        {gpuInfo === null
                          ? "Checking..."
                          : gpuInfo.supported
                          ? gpuInfo.adapter || "Available"
                          : "Not available"}
                      </p>
                    </div>
                  </div>
                  {gpuInfo?.supported ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Supported
                    </Badge>
                  ) : gpuInfo ? (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0">
                      <XCircle className="w-3 h-3 mr-1" />
                      Unsupported
                    </Badge>
                  ) : null}
                </div>
                {gpuInfo && !gpuInfo.supported && (
                  <p className="text-xs text-muted-foreground mt-2 ml-[42px]">
                    {gpuInfo.error} Models will fall back to WASM (slower).
                  </p>
                )}
              </div>

              {/* Network */}
              <div className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {isOnline ? (
                        <Wifi className="w-4 h-4 text-primary" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Network</p>
                      <p className="text-xs text-muted-foreground">
                        {isOnline
                          ? "Online — models can be downloaded"
                          : "Offline — downloaded models still work"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      isOnline
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0"
                    }
                  >
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>

              {/* Active Model */}
              <div className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HardDrive className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Active Model</p>
                      <p className="text-xs text-muted-foreground">
                        {currentModel
                          ? `${currentModel.name} (${currentModel.params})`
                          : "No model loaded"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      status === "ready"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0"
                        : "border-0"
                    }
                  >
                    {status === "ready"
                      ? "Ready"
                      : status === "idle"
                      ? "None"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Preferences */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Preferences
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-primary" />
                    ) : (
                      <Sun className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">
                      {isDark ? "Dark theme active" : "Light theme active"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                  data-testid="switch-theme"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* About */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              About PocketLLM
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">PocketLLM</p>
                    <p className="text-xs text-muted-foreground">v1.0.0 — Open Source</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Run AI models directly on your smartphone. No cloud, no subscription,
                  no data collection. Completely open source and free forever.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Privacy-first
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Works offline
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Github className="w-3 h-3 mr-1" />
                    Open source
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground mb-1">How it works</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Models are downloaded once and cached in your browser</li>
                      <li>Inference runs via WebGPU (GPU) or WebAssembly (CPU)</li>
                      <li>No data ever leaves your device during inference</li>
                      <li>Works fully offline after model download</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <p>
                      Built with{" "}
                      <a
                        href="https://github.com/nicholasgriffintn/web-llm"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        WebLLM
                      </a>{" "}
                      by MLC AI. Models from Meta, Google, Microsoft, Alibaba,
                      and HuggingFace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="pb-8" />
        </div>
      </ScrollArea>
    </div>
  );
}
