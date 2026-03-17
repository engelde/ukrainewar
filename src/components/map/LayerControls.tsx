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
  TbFlame,
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
  {
    key: "conflicts",
    label: "Conflict Events",
    color: "bg-purple-500",
    description: "ACLED battle & incident data",
    Icon: TbFlame,
  },
];

export default function LayerControls({
  layers,
  onToggle,
}: LayerControlsProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "overflow-hidden"
        )}
      >
        <div className="drag-handle flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing flex-1">
          <TbStack2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Layers
          </span>
        </div>
        <button
          onClick={() => setCollapsed(false)}
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
        "max-h-[calc(100vh-10rem)]"
      )}
    >
      <div className="flex items-center border-b border-border/30">
        <div className="drag-handle flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing flex-1">
          <TbStack2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Layers
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3 w-3" />
        </button>
      </div>
      {LAYER_CONFIG.map((layer) => (
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
