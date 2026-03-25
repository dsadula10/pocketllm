import { useState, useEffect, useCallback, useRef } from "react";
import { webllmEngine, type EngineStatus, type DownloadProgress } from "./webllm-engine";

export function useWebLLMStatus() {
  const [status, setStatus] = useState<EngineStatus>(webllmEngine.getStatus());
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    return webllmEngine.onStatusChange((s, d) => {
      setStatus(s);
      setDetail(d || "");
    });
  }, []);

  return { status, detail, currentModelId: webllmEngine.getCurrentModelId() };
}

export function useDownloadProgress() {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    return webllmEngine.onProgress(setProgress);
  }, []);

  return progress;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((d) => !d), []);

  return { isDark, toggle };
}

export function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>) {
  const resize = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [ref]);

  return resize;
}
