"use client";

import { useEffect, useRef, useState } from "react";
import {
  TbBolt,
  TbCoin,
  TbFlag,
  TbGlobe,
  TbHeartHandshake,
  TbMinus,
  TbPlus,
  TbScale,
  TbSettings,
  TbShieldCheck,
  TbSkull,
  TbStack,
  TbUserMinus,
  TbX,
} from "react-icons/tb";
import { useFontSize } from "@/hooks/useFontSize";
import { cn } from "@/lib/utils";

interface PanelToggles {
  events?: () => void;
  russianLosses?: () => void;
  layers?: () => void;
  humanitarian?: () => void;
  spending?: () => void;
  energy?: () => void;
  airDefense?: () => void;
  support?: () => void;
  ukraineLosses?: () => void;
  sanctions?: () => void;
}

interface PanelStates {
  events?: boolean;
  russianLosses?: boolean;
  layers?: boolean;
  humanitarian?: boolean;
  spending?: boolean;
  energy?: boolean;
  airDefense?: boolean;
  support?: boolean;
  ukraineLosses?: boolean;
  sanctions?: boolean;
}

interface OptionsPopupProps {
  panelToggles?: PanelToggles;
  panelStates?: PanelStates;
}

const PANEL_ITEMS = [
  { label: "Events", icon: TbFlag, key: "events" as const },
  { label: "Russian Losses", icon: TbSkull, key: "russianLosses" as const },
  { label: "Layers", icon: TbStack, key: "layers" as const },
  { label: "Humanitarian", icon: TbHeartHandshake, key: "humanitarian" as const },
  { label: "Spending & Aid", icon: TbCoin, key: "spending" as const },
  { label: "Energy", icon: TbBolt, key: "energy" as const },
  { label: "Air Defense", icon: TbShieldCheck, key: "airDefense" as const },
  { label: "Intl Support", icon: TbGlobe, key: "support" as const },
  { label: "UA Losses", icon: TbUserMinus, key: "ukraineLosses" as const },
  { label: "Sanctions", icon: TbScale, key: "sanctions" as const },
] as const;

export default function OptionsPopup({ panelToggles, panelStates }: OptionsPopupProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { fontSize, increase, decrease, reset, canIncrease, canDecrease, isDefault } =
    useFontSize();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={popoverRef} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 cursor-pointer",
          "bg-background/70 backdrop-blur-xl",
          "border",
          "text-xs font-bold uppercase tracking-wider",
          "transition-colors",
          open
            ? "border-ua-blue/50 text-ua-blue"
            : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60",
        )}
      >
        <TbSettings className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Options</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 z-50",
            "rounded-lg",
            "bg-background/95 backdrop-blur-xl",
            "border border-border/50",
            "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
            "w-[280px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ua-blue">
              Options
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close options"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <TbX className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Panels section */}
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Panels
            </div>
            <div className="grid grid-cols-2 gap-1">
              {PANEL_ITEMS.map(({ label, icon: Icon, key }) => {
                const active = panelStates?.[key];
                return (
                  <button
                    key={key}
                    onClick={() => panelToggles?.[key]?.()}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
                      "text-[10px] font-semibold uppercase tracking-wider",
                      active
                        ? "text-ua-blue bg-ua-blue/10"
                        : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style section */}
          <div className="px-3 py-2.5 border-t border-border/30">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Style
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Text Size
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={decrease}
                  disabled={!canDecrease}
                  aria-label="Decrease font size"
                  className={cn(
                    "rounded-md p-1 transition-colors",
                    canDecrease
                      ? "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50"
                      : "text-muted-foreground/30 cursor-not-allowed",
                  )}
                >
                  <TbMinus className="h-3 w-3" />
                </button>
                <button
                  onClick={reset}
                  disabled={isDefault}
                  aria-label="Reset font size"
                  className={cn(
                    "text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors min-w-[32px] text-center",
                    !isDefault ? "text-ua-blue hover:bg-ua-blue/10" : "text-muted-foreground/50",
                  )}
                >
                  {fontSize}px
                </button>
                <button
                  onClick={increase}
                  disabled={!canIncrease}
                  aria-label="Increase font size"
                  className={cn(
                    "rounded-md p-1 transition-colors",
                    canIncrease
                      ? "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50"
                      : "text-muted-foreground/30 cursor-not-allowed",
                  )}
                >
                  <TbPlus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
