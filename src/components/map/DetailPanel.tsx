"use client";

import { GiBattleship, GiHelicopter, GiRocket, GiTank } from "react-icons/gi";
import {
  TbBomb,
  TbDrone,
  TbExternalLink,
  TbPlane,
  TbRadar,
  TbShieldChevron,
  TbTruck,
  TbX,
} from "react-icons/tb";
import { t } from "@/i18n";
import type { EquipmentMarker } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { color: string; bg: string; labelKey: string }> = {
  destroyed: { color: "text-destruction", bg: "bg-destruction/15", labelKey: "detail.destroyed" },
  damaged: { color: "text-damage", bg: "bg-damage/15", labelKey: "detail.damaged" },
  captured: { color: "text-capture", bg: "bg-capture/15", labelKey: "detail.captured" },
  abandoned: { color: "text-abandoned", bg: "bg-abandoned/15", labelKey: "detail.abandoned" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  tank: <GiTank className="h-5 w-5" />,
  ifv: <TbShieldChevron className="h-5 w-5" />,
  apc: <TbShieldChevron className="h-5 w-5" />,
  artillery: <TbBomb className="h-5 w-5" />,
  mlrs: <GiRocket className="h-5 w-5" />,
  helicopter: <GiHelicopter className="h-5 w-5" />,
  jet: <TbPlane className="h-5 w-5" />,
  ship: <GiBattleship className="h-5 w-5" />,
  uav: <TbDrone className="h-5 w-5" />,
  "air defense": <TbRadar className="h-5 w-5" />,
  vehicle: <TbTruck className="h-5 w-5" />,
};

function getTypeIcon(type: string) {
  const lower = type.toLowerCase();
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <TbBomb className="h-5 w-5" />;
}

interface DetailPanelProps {
  marker: EquipmentMarker;
  onClose: () => void;
}

export default function DetailPanel({ marker, onClose }: DetailPanelProps) {
  const statusStyle = STATUS_STYLES[marker.status] || {
    color: "text-muted-foreground",
    bg: "bg-muted/15",
    labelKey: "",
  };
  const statusLabel = statusStyle.labelKey ? t(statusStyle.labelKey) : marker.status;

  return (
    <div
      className={cn(
        "fixed bottom-28 left-1/2 -translate-x-1/2 z-40",
        "sm:bottom-32",
        "w-[calc(100%-2rem)] max-w-sm",
        "rounded-lg",
        "bg-background/90 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/40",
        "animate-in slide-in-from-bottom-4 fade-in duration-200",
      )}
    >
      {/* Header with type icon and model */}
      <div className="flex items-start justify-between gap-3 border-b border-border/30 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-lg",
              statusStyle.bg,
              statusStyle.color,
            )}
          >
            {getTypeIcon(marker.type)}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight truncate">
              {marker.model}
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {marker.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <TbX className="h-4 w-4" />
        </button>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 py-2.5">
        <div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {t("detail.status")}
          </span>
          <div className={cn("text-xs font-semibold capitalize", statusStyle.color)}>
            {statusLabel}
          </div>
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {t("detail.date")}
          </span>
          <div className="text-xs text-foreground">{marker.date}</div>
        </div>
        {marker.location && (
          <div className="col-span-2">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {t("detail.location")}
            </span>
            <div className="text-xs text-foreground">{marker.location}</div>
          </div>
        )}
        <div className="col-span-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {t("detail.coordinates")}
          </span>
          <div className="text-[11px] font-mono text-muted-foreground">
            {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Source link */}
      <div className="px-3 py-2 border-t border-border/30">
        <a
          href={`https://ukr.warspotting.net/search/?q=${marker.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-ua-blue hover:text-ua-blue-light transition-colors"
        >
          {t("detail.viewOnWarSpotting")}
          <TbExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
