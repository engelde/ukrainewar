"use client";

import type { EquipmentMarker } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  destroyed: { color: "text-destruction", label: "Destroyed" },
  damaged: { color: "text-damage", label: "Damaged" },
  captured: { color: "text-capture", label: "Captured" },
  abandoned: { color: "text-abandoned", label: "Abandoned" },
};

interface DetailPanelProps {
  marker: EquipmentMarker;
  onClose: () => void;
}

export default function DetailPanel({ marker, onClose }: DetailPanelProps) {
  const statusStyle = STATUS_STYLES[marker.status] || {
    color: "text-muted-foreground",
    label: marker.status,
  };

  return (
    <div
      className={cn(
        "fixed left-3 top-14 z-30 w-72",
        "sm:left-4 sm:top-16",
        "rounded-lg",
        "bg-background/85 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "animate-in slide-in-from-left-4 fade-in duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border/30 p-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-bold text-foreground leading-tight">
            {marker.model}
          </h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {marker.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 p-3">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <span
            className={cn(
              "text-xs font-semibold capitalize",
              statusStyle.color
            )}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Date:</span>
          <span className="text-xs text-foreground">{marker.date}</span>
        </div>

        {/* Location */}
        {marker.location && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground shrink-0">
              Location:
            </span>
            <span className="text-xs text-foreground">{marker.location}</span>
          </div>
        )}

        {/* Coordinates */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Coords:</span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
          </span>
        </div>

        {/* Source link */}
        <div className="mt-1 pt-2 border-t border-border/30">
          <a
            href={`https://ukr.warspotting.net/search/?q=${marker.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-ua-blue hover:text-ua-blue-light transition-colors"
          >
            View on WarSpotting →
          </a>
        </div>
      </div>
    </div>
  );
}
