"use client";

import { useEffect, useState } from "react";
import { TbAlertTriangle, TbCheck, TbClock, TbDatabase, TbExternalLink } from "react-icons/tb";
import { DATA_SOURCES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface PipelineStatus {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
  status: "live" | "cached" | "stale" | "static" | "unknown";
  lastUpdated: number | null;
  ttl: number;
  age: number | null;
}

interface StatusResponse {
  pipelines: PipelineStatus[];
  timestamp: number;
}

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  live: {
    dot: "bg-[oklch(0.65_0.2_145)]",
    icon: TbCheck,
    iconClass: "text-[oklch(0.65_0.2_145)]",
    label: "Live",
  },
  cached: {
    dot: "bg-[oklch(0.8_0.17_85)]",
    icon: TbClock,
    iconClass: "text-[oklch(0.8_0.17_85)]",
    label: "Cached",
  },
  stale: {
    dot: "bg-[oklch(0.6_0.22_25)]",
    icon: TbAlertTriangle,
    iconClass: "text-[oklch(0.6_0.22_25)]",
    label: "Stale",
  },
  static: {
    dot: "bg-muted-foreground/40",
    icon: TbDatabase,
    iconClass: "text-muted-foreground/40",
    label: "Static",
  },
  unknown: {
    dot: "bg-muted-foreground/20",
    icon: TbClock,
    iconClass: "text-muted-foreground/20",
    label: "No data",
  },
} as const;

const CATEGORY_ORDER = [
  "Territory",
  "Casualties",
  "Equipment",
  "Events",
  "Energy",
  "Humanitarian",
  "International",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAge(ageSeconds: number | null): string {
  if (ageSeconds === null) return "";
  if (ageSeconds < 60) return "just now";
  if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m ago`;
  if (ageSeconds < 86400) return `${Math.floor(ageSeconds / 3600)}h ago`;
  return `${Math.floor(ageSeconds / 86400)}d ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pb-1.5 border-b border-border/20">
      {(["live", "cached", "stale", "static"] as const).map((s) => {
        const config = STATUS_CONFIG[s];
        const Icon = config.icon;
        return (
          <div key={s} className="flex items-center gap-1">
            <Icon className={cn("h-2.5 w-2.5", config.iconClass)} />
            <span className="text-[0.5rem] text-muted-foreground/50">{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function PipelineRow({ pipeline }: { pipeline: PipelineStatus }) {
  const config = STATUS_CONFIG[pipeline.status];
  const hasUrl = pipeline.url.length > 0;

  const content = (
    <>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", config.dot)}
          title={config.label}
        />
        <div className="min-w-0">
          <div
            className={cn(
              "text-[0.625rem] font-medium text-foreground/80 truncate",
              hasUrl && "group-hover:text-ua-blue transition-colors",
            )}
          >
            {pipeline.name}
          </div>
          <div className="text-[0.5625rem] text-muted-foreground/60 truncate">
            {pipeline.description}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {pipeline.age !== null && (
          <span className="text-[0.5rem] text-muted-foreground/40">{formatAge(pipeline.age)}</span>
        )}
        {hasUrl && (
          <TbExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-ua-blue transition-colors flex-shrink-0" />
        )}
      </div>
    </>
  );

  const baseClass = "flex items-center justify-between gap-2 rounded px-1.5 py-0.5 -mx-1.5";

  if (hasUrl) {
    return (
      <a
        href={pipeline.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClass, "hover:bg-surface-elevated/50 transition-colors group")}
      >
        {content}
      </a>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

function CategorySection({
  category,
  pipelines,
}: {
  category: string;
  pipelines: PipelineStatus[];
}) {
  return (
    <div className="space-y-0.5">
      <h4 className="text-[0.5625rem] font-bold uppercase tracking-widest text-muted-foreground/70">
        {category}
      </h4>
      <div className="space-y-0">
        {pipelines.map((p) => (
          <PipelineRow key={p.id} pipeline={p} />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1">
          <div className="h-2.5 w-16 animate-pulse rounded bg-muted/50" />
          <div className="space-y-0.5">
            <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted/30" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Fallback: renders the static DATA_SOURCES list (same as old Sources panel). */
function StaticFallback() {
  return (
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
            <div className="text-[0.625rem] font-medium text-foreground/80 group-hover:text-ua-blue transition-colors">
              {source.name}
            </div>
            <div className="text-[0.5625rem] text-muted-foreground/60">{source.description}</div>
          </div>
          <TbExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-ua-blue transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function DataFreshness() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/status");
        if (res.ok && !cancelled) {
          setData(await res.json());
        } else if (!cancelled) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <StaticFallback />;
  if (!data) return <LoadingSkeleton />;

  const grouped = new Map<string, PipelineStatus[]>();
  for (const pipeline of data.pipelines) {
    const list = grouped.get(pipeline.category) || [];
    list.push(pipeline);
    grouped.set(pipeline.category, list);
  }

  return (
    <div className="space-y-2">
      <StatusLegend />
      <div className="max-h-[60vh] overflow-y-auto space-y-2 -mx-0.5 px-0.5">
        {CATEGORY_ORDER.map((category) => {
          const pipelines = grouped.get(category);
          if (!pipelines) return null;
          return <CategorySection key={category} category={category} pipelines={pipelines} />;
        })}
      </div>
    </div>
  );
}
