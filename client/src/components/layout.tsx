import { useLocation, Link } from "wouter";
import { useWebLLMStatus, useTheme } from "@/lib/hooks";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import {
  MessageSquare,
  Box,
  Zap,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: MessageSquare, label: "Chat" },
  { path: "/models", icon: Box, label: "Models" },
  { path: "/automations", icon: Zap, label: "Automate" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { status } = useWebLLMStatus();

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Bottom Navigation — mobile-first, persistent */}
      <nav
        className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive =
              path === "/" ? location === "/" || location === "" : location.startsWith(path);

            return (
              <Link key={path} href={path}>
                <button
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${label.toLowerCase()}`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    {/* Status dot for Chat when model is generating */}
                    {label === "Chat" && status === "generating" && !isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
