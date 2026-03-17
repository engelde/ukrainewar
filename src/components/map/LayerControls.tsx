"use client";

import { useState } from "react";
import type { MapLayers } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  TbMapPin,
  TbSwords,
  TbBomb,
  TbBorderAll,
  TbChevronDown,
  TbStack2,
} from "react-icons/tb";
import type { IconType } from "react-icons";

interface LayerControlsProps {
  layers: MapLayers;
  onToggle: (layer: keyof MapLayers) => void;
}

const LAYER_CONFIG: {
  key: keyof MapLayers;
  label: string;
  color: string;
  description: string;
  Icon: IconType;
}[] = [
  {
    key: "territory",
    label: "Territory Control",
    color: "bg-occupation",
    description: "Russian-occupied areas",
    Icon: TbMapPin,
  },
  {
    key: "frontline",
    label: "Frontline",
    color: "bg-destruction",
    description: "Current front lines",
    Icon: TbSwords,
  },
  {
    key: "equipment",
    label: "Equipment Losses",
    color: "bg-damage",
    description: "Confirmed loss locations",
    Icon: TbBomb,
  },
  {
    key: "border",
    label: "Ukraine Border",
    color: "bg-ua-blue",
    description: "National boundary highlight",
    Icon: TbBorderAll,
  },
];

export default function LayerControls({
  layers,
  onToggle,
}: LayerControlsProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg",
        "bg-background/80 backdrop-blur-xl",
        "border border-border/50",
        "overflow-hidden",
        "max-h-[calc(100vh-10rem)]"
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-border/30 hover:bg-surface-elevated/50 transition-colors cursor-grab active:cursor-grabbing"
      >
        <TbStack2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Layers
        </span>
        <TbChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground ml-auto transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </button>
      {!collapsed &&
        LAYER_CONFIG.map((layer) => (
          <button
            key={layer.key}
            onClick={() => onToggle(layer.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              "border-b border-border/20 last:border-b-0",
              "hover:bg-surface-elevated/50 transition-colors",
              "text-left"
            )}
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border border-border/50 transition-colors",
                layers[layer.key]
                  ? "bg-ua-blue/20 border-ua-blue/50"
                  : "bg-transparent"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <layer.Icon
                  className={cn(
                    "h-3 w-3",
                    layers[layer.key]
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                />
                <span className="text-xs text-foreground">{layer.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {layer.description}
              </span>
            </div>
          </button>
        ))}
    </div>
  );
}
