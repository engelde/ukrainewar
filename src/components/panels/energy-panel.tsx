"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  TbAtom,
  TbBolt,
  TbChevronDown,
  TbChevronUp,
  TbDroplet,
  TbFlame,
  TbSun,
} from "react-icons/tb";
import { PanelError, PanelSkeleton } from "@/components/ui/panel-skeleton";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

interface EnergyPlant {
  name: string;
  type: string;
  capacity: number;
  status: string;
  operational: boolean;
}

interface EnergyData {
  totalCapacity: number;
  currentGeneration: number | null;
  nuclearShare: number;
  renewableShare: number;
  status: "normal" | "stressed" | "critical";
  plants: EnergyPlant[];
  damagedCapacity: number;
  source: string;
  lastUpdated: string;
}

interface EnergyPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string;
}

const STATUS_CONFIG = {
  normal: {
    label: "Normal",
    color: "bg-[#48BB78]",
    textColor: "text-[#48BB78]",
    dotColor: "bg-[#48BB78]",
  },
  stressed: {
    label: "Stressed",
    color: "bg-[#ECC94B]",
    textColor: "text-[#ECC94B]",
    dotColor: "bg-[#ECC94B]",
  },
  critical: {
    label: "Critical",
    color: "bg-[#E53E3E]",
    textColor: "text-[#E53E3E]",
    dotColor: "bg-[#E53E3E]",
  },
} as const;

const PLANT_STATUS_DOT: Record<string, string> = {
  operational: "bg-[#48BB78]",
  damaged: "bg-[#ECC94B]",
  destroyed: "bg-[#E53E3E]",
  occupied: "bg-muted-foreground/40",
  shutdown: "bg-muted-foreground/40",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  nuclear: <TbAtom className="h-2.5 w-2.5 text-[#48BB78]" />,
  thermal: <TbFlame className="h-2.5 w-2.5 text-damage" />,
  hydro: <TbDroplet className="h-2.5 w-2.5 text-ua-blue-light" />,
  renewable: <TbSun className="h-2.5 w-2.5 text-ua-yellow" />,
  solar: <TbSun className="h-2.5 w-2.5 text-ua-yellow" />,
  wind: <TbSun className="h-2.5 w-2.5 text-ua-blue" />,
};

function formatGW(n: number): string {
  if (n >= 1) return `${n.toFixed(1)} GW`;
  return `${(n * 1000).toFixed(0)} MW`;
}

function EnergyPanelInner({ isOpen, onToggle, timelineDate }: EnergyPanelProps) {
  const [data, setData] = useState<EnergyData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const url = timelineDate ? `/api/energy?date=${timelineDate}` : "/api/energy";
        const r = await fetch(url, { signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (d?.totalCapacity != null) setData(d);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") console.error("Energy fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, [timelineDate]);

  const operationalCapacity = useMemo(() => {
    if (!data) return 0;
    return data.totalCapacity - data.damagedCapacity;
  }, [data]);

  const damagedPct = useMemo(() => {
    if (!data || data.totalCapacity === 0) return 0;
    return (data.damagedCapacity / data.totalCapacity) * 100;
  }, [data]);

  const plantsByType = useMemo(() => {
    if (!data?.plants) return {};
    const grouped: Record<string, EnergyPlant[]> = {};
    for (const p of data.plants) {
      const type = p.type || "other";
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(p);
    }
    return grouped;
  }, [data?.plants]);

  // Generation mix segments
  const mixSegments = useMemo(() => {
    if (!data) return [];
    const thermalShare = 100 - data.nuclearShare - data.renewableShare;
    return [
      { label: "Nuclear", share: data.nuclearShare, color: "bg-[#48BB78]" },
      { label: "Thermal", share: thermalShare > 0 ? thermalShare : 0, color: "bg-damage" },
      { label: "Renewable", share: data.renewableShare, color: "bg-ua-yellow" },
    ].filter((s) => s.share > 0);
  }, [data]);

  if (!isOpen) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "overflow-hidden",
        )}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 flex-1">
          <TbBolt className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-orange-400">
            {t("energy.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand energy panel"
          className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3 w-3 rotate-180" />
        </button>
      </div>
    );
  }

  const statusConfig = data ? STATUS_CONFIG[data.status] : null;

  return (
    <div
      className={cn(
        "w-[calc(100vw-1.5rem)] sm:w-[300px]",
        "max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]",
        "overflow-y-auto",
        "rounded-lg",
        "bg-background/80 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30",
      )}
    >
      {/* Header */}
      <div className="drag-handle sticky top-0 bg-background/90 backdrop-blur-sm px-3 py-2 border-b border-border/30 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <TbBolt className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-orange-400">
            {t("energy.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close energy panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Loading */}
      {loading && <PanelSkeleton rows={3} />}

      {!loading && data && (
        <div className="p-2.5 space-y-2.5">
          {/* Status indicator */}
          {statusConfig && (
            <div className="flex items-center gap-2 px-1">
              <span className={cn("inline-block h-2 w-2 rounded-full", statusConfig.dotColor)} />
              <span
                className={cn(
                  "text-[0.625rem] font-semibold uppercase tracking-wider",
                  statusConfig.textColor,
                )}
              >
                Grid status: {statusConfig.label}
              </span>
            </div>
          )}

          {/* Capacity overview */}
          <div className="space-y-1.5 pb-2 border-b border-border/20">
            <div className="flex justify-between items-baseline px-1">
              <span className="text-[0.5625rem] text-muted-foreground uppercase tracking-wider">
                {t("energy.capacity")}
              </span>
              <span className="text-[0.625rem] font-mono text-foreground/80 tabular-nums">
                {formatGW(data.totalCapacity)}
              </span>
            </div>

            {/* Capacity bar */}
            <div className="h-3 bg-surface-elevated/50 rounded-full overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-[#48BB78]/70 transition-all duration-700"
                  style={{ width: `${100 - damagedPct}%` }}
                  title={`Operational: ${formatGW(operationalCapacity)}`}
                />
                <div
                  className="bg-[#E53E3E]/60 transition-all duration-700"
                  style={{ width: `${damagedPct}%` }}
                  title={`${t("energy.damaged")}: ${formatGW(data.damagedCapacity)}`}
                />
              </div>
            </div>

            <div className="flex justify-between text-[0.5625rem] px-1">
              <span className="text-[#48BB78]/80 font-mono tabular-nums">
                {formatGW(operationalCapacity)} operational
              </span>
              <span className="text-[#E53E3E]/80 font-mono tabular-nums">
                {formatGW(data.damagedCapacity)} damaged
              </span>
            </div>
          </div>

          {/* Generation mix */}
          {mixSegments.length > 0 && (
            <div className="space-y-1.5 pb-2 border-b border-border/20">
              <div className="text-[0.5625rem] text-muted-foreground uppercase tracking-wider px-1">
                Generation mix
              </div>
              <div className="h-2 flex rounded-full overflow-hidden">
                {mixSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className={cn("h-full transition-all duration-700", seg.color)}
                    style={{ width: `${seg.share}%` }}
                    title={`${seg.label}: ${seg.share}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-1">
                {mixSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-1">
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-sm", seg.color)} />
                    <span className="text-[0.5625rem] text-muted-foreground">
                      {seg.label} {seg.share}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plant list (expandable) */}
          <div>
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === "plants" ? null : "plants")}
              className="flex items-center gap-1 w-full text-left"
            >
              {expandedSection === "plants" ? (
                <TbChevronUp className="h-2.5 w-2.5 text-muted-foreground" />
              ) : (
                <TbChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
              )}
              <span className="text-[0.5625rem] text-muted-foreground uppercase tracking-wider">
                Power plants ({data.plants.length})
              </span>
            </button>
            {expandedSection === "plants" && (
              <div className="mt-1.5 space-y-2">
                {Object.entries(plantsByType).map(([type, plants]) => (
                  <div key={type}>
                    <div className="flex items-center gap-1 mb-1 px-0.5">
                      {TYPE_ICON[type] ?? <TbBolt className="h-2.5 w-2.5 text-muted-foreground" />}
                      <span className="text-[0.5625rem] text-muted-foreground capitalize font-medium">
                        {type}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {plants.map((plant) => (
                        <div
                          key={plant.name}
                          className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-surface-elevated/30 transition-colors"
                        >
                          <span
                            className={cn(
                              "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                              PLANT_STATUS_DOT[plant.status] ?? "bg-muted-foreground/40",
                            )}
                            title={plant.status}
                          />
                          <span className="text-[0.625rem] text-foreground/80 truncate flex-1">
                            {plant.name}
                          </span>
                          <span className="text-[0.5625rem] font-mono text-muted-foreground tabular-nums shrink-0">
                            {formatGW(plant.capacity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No data state */}
      {!loading && !data && <PanelError message={t("energy.unavailable")} />}

      {/* Source footer */}
      {data && (
        <div className="drag-handle px-3 py-1.5 border-t border-border/30 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-1.5 text-[0.5rem] text-muted-foreground/50">
            <span>Source:</span>
            <a
              href="https://transparency.entsoe.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ua-blue transition-colors"
            >
              ENTSO-E
            </a>
            <span>/</span>
            <span>Open data</span>
            {data.lastUpdated && (
              <>
                <span className="mx-0.5">·</span>
                <span>{data.lastUpdated}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const EnergyPanel = memo(EnergyPanelInner);
export default EnergyPanel;
