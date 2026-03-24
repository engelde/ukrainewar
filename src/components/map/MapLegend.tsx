"use client";

import { useState } from "react";
import { TbChevronDown, TbChevronUp, TbMap2 } from "react-icons/tb";

interface LegendItem {
  label: string;
  color: string;
  type: "fill" | "line" | "dashed" | "circle" | "icon";
  secondary?: string;
}

const TERRITORY_ITEMS: LegendItem[] = [
  {
    label: "Russian-occupied",
    color: "#c53030",
    type: "fill",
  },
  {
    label: "Contested",
    color: "#eab308",
    type: "fill",
  },
  {
    label: "Frontline",
    color: "#ff4444",
    type: "dashed",
  },
];

const CONFLICT_ITEMS: LegendItem[] = [
  {
    label: "Battles / Explosions",
    color: "#ef4444",
    type: "circle",
  },
  {
    label: "Armed clashes",
    color: "#f97316",
    type: "circle",
  },
  {
    label: "Shelling / Missile strikes",
    color: "#a855f7",
    type: "circle",
  },
  {
    label: "Air/Drone strikes",
    color: "#3b82f6",
    type: "circle",
  },
];

const INFRASTRUCTURE_ITEMS: LegendItem[] = [
  {
    label: "Nuclear plants",
    color: "#facc15",
    type: "icon",
    secondary: "☢",
  },
  {
    label: "Dams",
    color: "#38bdf8",
    type: "icon",
    secondary: "⌇",
  },
  {
    label: "Gas pipelines",
    color: "#94a3b8",
    type: "line",
  },
  {
    label: "Military bases",
    color: "#6366f1",
    type: "circle",
  },
];

const OVERLAY_ITEMS: LegendItem[] = [
  {
    label: "Conflict heatmap",
    color: "#ef4444",
    type: "fill",
    secondary: "gradient",
  },
  {
    label: "Thermal anomalies",
    color: "#ff6b00",
    type: "circle",
  },
  {
    label: "Equipment losses",
    color: "#a855f7",
    type: "circle",
  },
];

function LegendSwatch({ item }: { item: LegendItem }) {
  if (item.type === "fill") {
    return (
      <span
        className="inline-block h-3 w-4 rounded-sm border border-white/10"
        style={{
          backgroundColor: item.color,
          opacity: item.secondary === "gradient" ? 0.5 : 0.35,
        }}
      />
    );
  }
  if (item.type === "line") {
    return (
      <span className="inline-flex h-3 w-4 items-center">
        <span className="h-[2px] w-full rounded-full" style={{ backgroundColor: item.color }} />
      </span>
    );
  }
  if (item.type === "dashed") {
    return (
      <span className="inline-flex h-3 w-4 items-center">
        <span
          className="h-[2px] w-full"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${item.color} 0px, ${item.color} 4px, transparent 4px, transparent 7px)`,
          }}
        />
      </span>
    );
  }
  if (item.type === "circle") {
    return (
      <span className="inline-flex h-3 w-4 items-center justify-center">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color, opacity: 0.8 }}
        />
      </span>
    );
  }
  if (item.type === "icon") {
    return (
      <span
        className="inline-flex h-3 w-4 items-center justify-center text-[10px]"
        style={{ color: item.color }}
      >
        {item.secondary}
      </span>
    );
  }
  return null;
}

function LegendSection({ title, items }: { title: string; items: LegendItem[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
        {title}
      </h4>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <LegendSwatch item={item} />
            <span className="text-[10px] text-foreground/70">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MapLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-[170px] left-3 z-[35] pointer-events-auto">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-md border border-border/40 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-background/90 transition-colors"
        title="Map legend"
      >
        <TbMap2 className="h-3.5 w-3.5" />
        <span>Legend</span>
        {expanded ? <TbChevronDown className="h-3 w-3" /> : <TbChevronUp className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="absolute bottom-8 left-0 w-48 rounded-lg bg-background/90 backdrop-blur-xl border border-border/50 p-3 space-y-2.5 shadow-lg">
          <LegendSection title="Territory" items={TERRITORY_ITEMS} />
          <LegendSection title="Conflicts" items={CONFLICT_ITEMS} />
          <LegendSection title="Infrastructure" items={INFRASTRUCTURE_ITEMS} />
          <LegendSection title="Overlays" items={OVERLAY_ITEMS} />
        </div>
      )}
    </div>
  );
}
