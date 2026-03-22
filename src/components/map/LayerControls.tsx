"use client";

import type { IconType } from "react-icons";
import {
  TbArrowsRightLeft,
  TbBomb,
  TbBorderAll,
  TbBuildingBridge,
  TbChevronDown,
  TbFlame,
  TbMap,
  TbMapPin,
  TbRadioactive,
  TbShield,
  TbStack2,
  TbSwords,
} from "react-icons/tb";
import { t } from "@/i18n";
import type { MapLayers } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LayerControlsProps {
  layers: MapLayers;
  onToggle: (layer: keyof MapLayers) => void;
  collapsed?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
}

const LAYER_CONFIG: {
  key: keyof MapLayers;
  labelKey: string;
  color: string;
  Icon: IconType;
}[] = [
  { key: "territory", labelKey: "layers.territory", color: "bg-occupation", Icon: TbMapPin },
  { key: "frontline", labelKey: "layers.frontline", color: "bg-destruction", Icon: TbSwords },
  { key: "equipment", labelKey: "layers.equipment", color: "bg-damage", Icon: TbBomb },
  { key: "border", labelKey: "layers.border", color: "bg-ua-blue", Icon: TbBorderAll },
  { key: "conflicts", labelKey: "layers.conflicts", color: "bg-purple-500", Icon: TbFlame },
  { key: "heatmap", labelKey: "layers.heatmap", color: "bg-red-500", Icon: TbMap },
  { key: "battles", labelKey: "layers.battles", color: "bg-red-500", Icon: TbSwords },
  {
    key: "operations",
    labelKey: "layers.operations",
    color: "bg-amber-500",
    Icon: TbArrowsRightLeft,
  },
  {
    key: "infrastructure",
    labelKey: "layers.infrastructure",
    color: "bg-cyan-500",
    Icon: TbBuildingBridge,
  },
  {
    key: "nato",
    labelKey: "layers.nato",
    color: "bg-blue-400",
    Icon: TbShield,
  },
  {
    key: "thermal",
    labelKey: "layers.thermal",
    color: "bg-orange-500",
    Icon: TbRadioactive,
  },
];

export default function LayerControls({
  layers,
  onToggle,
  collapsed = false,
  onCollapse,
  onExpand,
}: LayerControlsProps) {
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "overflow-hidden",
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2 flex-1">
          <TbStack2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("layers.title")}
          </span>
        </div>
        <button
          onClick={onExpand}
          className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3 w-3 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg",
        "bg-background/80 backdrop-blur-xl",
        "border border-border/50",
        "overflow-hidden",
        "max-h-[calc(100vh-10rem)]",
      )}
    >
      <div className="flex items-center border-b border-border/30">
        <div className="drag-handle flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing flex-1">
          <TbStack2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("layers.title")}
          </span>
        </div>
        <button
          onClick={onCollapse}
          className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-2">
        {LAYER_CONFIG.map((layer, i) => (
          <button
            key={layer.key}
            onClick={() => onToggle(layer.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              "border-b border-border/20",
              i % 2 === 0 && "border-r border-r-border/20",
              "hover:bg-surface-elevated/50 transition-colors",
              "text-left",
            )}
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border border-border/50 transition-colors flex-shrink-0",
                layers[layer.key] ? "bg-ua-blue/20 border-ua-blue/50" : "bg-transparent",
              )}
            >
              {layers[layer.key] && (
                <svg
                  className="h-3 w-3 text-ua-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <layer.Icon
                className={cn(
                  "h-3 w-3 flex-shrink-0",
                  layers[layer.key] ? "text-foreground" : "text-muted-foreground",
                )}
              />
              <span className="text-xs text-foreground truncate">{t(layer.labelKey)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
