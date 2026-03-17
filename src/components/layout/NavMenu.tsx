"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DATA_SOURCES } from "@/lib/constants";
import { TbInfoCircle, TbDatabase, TbExternalLink, TbX } from "react-icons/tb";

type NavItem = "about" | "sources" | null;

export default function NavMenu() {
  const [active, setActive] = useState<NavItem>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };
    if (active) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [active]);

  return (
    <div ref={menuRef} className="relative flex items-center gap-1">
      <button
        onClick={() => setActive(active === "about" ? null : "about")}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1.5",
          "text-[10px] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "about"
            ? "bg-background/90 text-ua-blue border border-border/50"
            : "text-muted-foreground/70 hover:text-muted-foreground"
        )}
      >
        <TbInfoCircle className="h-3 w-3" />
        <span className="hidden sm:inline">About</span>
      </button>
      <button
        onClick={() => setActive(active === "sources" ? null : "sources")}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1.5",
          "text-[10px] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "sources"
            ? "bg-background/90 text-ua-blue border border-border/50"
            : "text-muted-foreground/70 hover:text-muted-foreground"
        )}
      >
        <TbDatabase className="h-3 w-3" />
        <span className="hidden sm:inline">Sources</span>
      </button>

      {/* Dropdown panels */}
      {active && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1.5 z-50",
            "rounded-lg",
            "bg-background/95 backdrop-blur-xl",
            "border border-border/50",
            "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
            "min-w-[240px] sm:min-w-[280px]"
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ua-blue">
              {active === "about" ? "About" : "Data Sources"}
            </span>
            <button
              onClick={() => setActive(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <TbX className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-3 py-2.5">
            {active === "about" && (
              <div className="space-y-2">
                <p className="text-[11px] text-foreground/80 leading-relaxed">
                  An interactive tracker for the Russo-Ukrainian War, visualizing
                  territory control, military losses, humanitarian impact, and
                  international aid from February 2022 to the present.
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Navigate the timeline to explore the war&apos;s progression.
                  Toggle map layers to view territory, equipment losses, battles,
                  and conflict events. All data updates daily from official sources.
                </p>
              </div>
            )}

            {active === "sources" && (
              <div className="flex flex-col gap-1">
                {DATA_SOURCES.map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded px-1.5 py-1 -mx-1.5 hover:bg-surface-elevated/50 transition-colors group"
                  >
                    <div>
                      <div className="text-[10px] font-medium text-foreground/80 group-hover:text-ua-blue transition-colors">
                        {source.name}
                      </div>
                      <div className="text-[9px] text-muted-foreground/60">
                        {source.description}
                      </div>
                    </div>
                    <TbExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-ua-blue transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
