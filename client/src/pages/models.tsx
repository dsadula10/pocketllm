import { useState } from "react";
import { webllmEngine, MODEL_CATALOG, type ModelInfo } from "@/lib/webllm-engine";
import { useWebLLMStatus, useDownloadProgress } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  CheckCircle2,
  Loader2,
  HardDrive,
  Cpu,
  Zap,
  AlertTriangle,
  Search,
  X,
} from "lucide-react";

const CATEGORY_LABELS = {
  tiny: { label: "Tiny", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  small: { label: "Small", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  medium: { label: "Medium", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
};

export default function ModelsPage() {
  const { status, detail, currentModelId } = useWebLLMStatus();
  const progress = useDownloadProgress();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = MODEL_CATALOG.filter((m) => {
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || m.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const handleLoadModel = async (model: ModelInfo) => {
    setError(null);
    setLoadingModelId(model.id);
    try {
      await webllmEngine.loadModel(model.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingModelId(null);
    }
  };

  const handleUnload = async () => {
    await webllmEngine.unloadModel();
  };

  const isLoading =
    status === "downloading" || status === "loading" || status === "checking";

  return (
    <div className="flex flex-col h-full" data-testid="models-page">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold mb-1">Model Library</h1>
        <p className="text-xs text-muted-foreground">
          Download and run AI models directly on your device. No internet
          required after download.
        </p>
      </div>

      {/* Currently Loaded Model */}
      {currentModelId && status === "ready" && (
        <div className="mx-4 mt-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {MODEL_CATALOG.find((m) => m.id === currentModelId)?.name || currentModelId}
              </span>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={handleUnload} data-testid="button-unload">
              Unload
            </Button>
          </div>
        </div>
      )}

      {/* Download Progress */}
      {isLoading && progress && (
        <div className="mx-4 mt-3 p-3 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium">
              {progress.text || "Downloading..."}
            </span>
          </div>
          <Progress value={progress.progress} className="h-2" />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              {Math.round(progress.progress)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progress.timeElapsed)}s elapsed
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-sm text-destructive flex-1">{error}</div>
          <Button size="sm" variant="ghost" onClick={() => setError(null)} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="input-search-models"
          />
        </div>
        <div className="flex gap-1.5">
          {(["tiny", "small", "medium"] as const).map((cat) => {
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(active ? null : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
                data-testid={`button-filter-${cat}`}
              >
                {CATEGORY_LABELS[cat].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Grid */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 pb-4">
          {filtered.map((model) => {
            const isCurrent = currentModelId === model.id && status === "ready";
            const isThisLoading = loadingModelId === model.id;
            const cat = CATEGORY_LABELS[model.category];

            return (
              <div
                key={model.id}
                className={`p-4 rounded-xl border transition-colors ${
                  isCurrent
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card hover:border-primary/20"
                }`}
                data-testid={`model-card-${model.id}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate">{model.name}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {model.description}
                    </p>
                  </div>

                  {isCurrent ? (
                    <Badge className="shrink-0 bg-primary/10 text-primary border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Loaded
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={isThisLoading ? "secondary" : "default"}
                      disabled={isLoading}
                      onClick={() => handleLoadModel(model)}
                      className="shrink-0"
                      data-testid={`button-load-${model.id}`}
                    >
                      {isThisLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 mr-1" />
                      )}
                      {isThisLoading ? "Loading" : "Load"}
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Cpu className="w-3 h-3" />
                    <span>{model.params}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HardDrive className="w-3 h-3" />
                    <span>{model.size}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    <span>{model.ramRequired} RAM</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {model.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No models match your search.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
