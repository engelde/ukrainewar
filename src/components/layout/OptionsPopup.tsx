"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  TbArrowsRightLeft,
  TbBolt,
  TbBomb,
  TbBorderAll,
  TbBuildingBridge,
  TbCoin,
  TbFlag,
  TbFlame,
  TbGlobe,
  TbHeartHandshake,
  TbMap,
  TbMapPin,
  TbMinus,
  TbPlus,
  TbSatellite,
  TbScale,
  TbSettings,
  TbShield,
  TbShieldCheck,
  TbSkull,
  TbSwords,
  TbUserMinus,
  TbX,
} from "react-icons/tb";
import { useFontSize } from "@/hooks/useFontSize";
import { usePanelOpacity } from "@/hooks/usePanelOpacity";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { t } from "@/i18n";
import type { MapLayers } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PanelToggles {
  events?: () => void;
  russianLosses?: () => void;
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
  layers?: MapLayers;
  onToggleLayer?: (layer: keyof MapLayers) => void;
}

const PANEL_ITEMS: { label: string; icon: IconType; key: keyof PanelStates }[] = [
  { label: "Events", icon: TbFlag, key: "events" },
  { label: "Russian Losses", icon: TbSkull, key: "russianLosses" },
  { label: "Humanitarian", icon: TbHeartHandshake, key: "humanitarian" },
  { label: "Spending & Aid", icon: TbCoin, key: "spending" },
  { label: "Energy", icon: TbBolt, key: "energy" },
  { label: "Air Defense", icon: TbShieldCheck, key: "airDefense" },
  { label: "Intl Support", icon: TbGlobe, key: "support" },
  { label: "UA Losses", icon: TbUserMinus, key: "ukraineLosses" },
  { label: "Sanctions", icon: TbScale, key: "sanctions" },
];

const LAYER_ITEMS: { label: string; icon: IconType; key: keyof MapLayers }[] = [
  { label: "Territory", icon: TbMapPin, key: "territory" },
  { label: "Frontline", icon: TbSwords, key: "frontline" },
  { label: "Equipment", icon: TbBomb, key: "equipment" },
  { label: "Border", icon: TbBorderAll, key: "border" },
  { label: "Conflicts", icon: TbFlame, key: "conflicts" },
  { label: "Heatmap", icon: TbMap, key: "heatmap" },
  { label: "Battles", icon: TbSwords, key: "battles" },
  { label: "Operations", icon: TbArrowsRightLeft, key: "operations" },
  { label: "Infrastructure", icon: TbBuildingBridge, key: "infrastructure" },
  { label: "Military Bases", icon: TbShield, key: "nato" },
  { label: "Thermal", icon: TbSatellite, key: "thermal" },
];

export default function OptionsPopup({
  panelToggles,
  panelStates,
  layers,
  onToggleLayer,
}: OptionsPopupProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const {
    fontSize,
    increase: fontInc,
    decrease: fontDec,
    reset: fontReset,
    canIncrease: fontCanInc,
    canDecrease: fontCanDec,
    isDefault: fontIsDefault,
  } = useFontSize();
  const {
    opacity,
    increase: opacInc,
    decrease: opacDec,
    reset: opacReset,
    canIncrease: opacCanInc,
    canDecrease: opacCanDec,
    isDefault: opacIsDefault,
  } = usePanelOpacity();
  const { reduceMotion, toggle: toggleMotion } = useReduceMotion();

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
            "max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-none",
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

          {/* Layers section */}
          <div className="px-3 py-2.5 border-t border-border/30">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Map Layers
            </div>
            <div className="grid grid-cols-2 gap-1">
              {LAYER_ITEMS.map(({ label, icon: Icon, key }) => {
                const active = layers?.[key];
                return (
                  <button
                    key={key}
                    onClick={() => onToggleLayer?.(key)}
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

            {/* Text size */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Text Size
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={fontDec}
                  disabled={!fontCanDec}
                  aria-label="Decrease font size"
                  className={cn(
                    "rounded-md p-1 transition-colors",
                    fontCanDec
                      ? "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50"
                      : "text-muted-foreground/30 cursor-not-allowed",
                  )}
                >
                  <TbMinus className="h-3 w-3" />
                </button>
                <button
                  onClick={fontReset}
                  disabled={fontIsDefault}
                  aria-label="Reset font size"
                  className={cn(
                    "text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors min-w-[32px] text-center",
                    !fontIsDefault
                      ? "text-ua-blue hover:bg-ua-blue/10"
                      : "text-muted-foreground/50",
                  )}
                >
                  {fontSize}px
                </button>
                <button
                  onClick={fontInc}
                  disabled={!fontCanInc}
                  aria-label="Increase font size"
                  className={cn(
                    "rounded-md p-1 transition-colors",
                    fontCanInc
                      ? "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50"
                      : "text-muted-foreground/30 cursor-not-allowed",
                  )}
                >
                  <TbPlus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Panel opacity */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Panel Opacity
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={opacDec}
                  disabled={!opacCanDec}
                  aria-label="Decrease panel opacity"
                  className={cn(
                    "rounded-md p-1 transition-colors",
                    opacCanDec
                      ? "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50"
                      : "text-muted-foreground/30 cursor-not-allowed",
                  )}
                >
                  <TbMinus className="h-3 w-3" />
                </button>
                <button
                  onClick={opacReset}
                  disabled={opacIsDefault}
                  aria-label="Reset panel opacity"
                  className={cn(
                    "text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors min-w-[32px] text-center",
                    !opacIsDefault
                      ? "text-ua-blue hover:bg-ua-blue/10"
                      : "text-muted-foreground/50",
                  )}
                >
                  {opacity}%
                </button>
                <button
                  onClick={opacInc}
                  disabled={!opacCanInc}
                  aria-label="Increase panel opacity"
                  className={cn(
                    "rounded-md p-1 transition-colors",
                    opacCanInc
                      ? "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50"
                      : "text-muted-foreground/30 cursor-not-allowed",
                  )}
                >
                  <TbPlus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Reduce motion */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Reduce Motion
              </span>
              <button
                onClick={toggleMotion}
                aria-label="Toggle reduce motion"
                className={cn(
                  "relative w-8 h-4 rounded-full transition-colors",
                  reduceMotion ? "bg-ua-blue/40" : "bg-border/40",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full transition-all",
                    reduceMotion ? "left-[18px] bg-ua-blue" : "left-0.5 bg-muted-foreground/50",
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
