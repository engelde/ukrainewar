"use client";

import type { MapLayers } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LayerControlsProps {
  layers: MapLayers;
  onToggle: (layer: keyof MapLayers) => void;
}

const LAYER_CONFIG: {
  key: keyof MapLayers;
  label: string;
  color: string;
  description: string;
}[] = [
  {
    key: "territory",
    label: "Territory Control",
    color: "bg-occupation",
    description: "Russian-occupied areas",
  },
  {
    key: "frontline",
    label: "Frontline",
    color: "bg-destruction",
    description: "Current front lines",
  },
  {
    key: "equipment",
    label: "Equipment Losses",
    color: "bg-damage",
    description: "Confirmed loss locations",
  },
];

export default function LayerControls({
  layers,
  onToggle,
}: LayerControlsProps) {
  return (
    <div
      className={cn(
        "fixed left-3 bottom-24 z-30",
        "sm:left-4 sm:bottom-28",
        "flex flex-col rounded-lg",
        "bg-background/80 backdrop-blur-xl",
        "border border-border/50",
        "overflow-hidden"
      )}
    >
      <div className="px-3 py-2 border-b border-border/30">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Map Layers
        </span>
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
              <div className={cn("h-2 w-2 rounded-full", layer.color)} />
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
