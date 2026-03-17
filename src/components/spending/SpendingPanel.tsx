"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  TbCurrencyEuro,
  TbShieldCheckered,
  TbBuildingBank,
  TbHeartHandshake,
  TbChevronDown,
  TbChevronUp,
} from "react-icons/tb";
import { AnimatedCounter } from "@/components/stats/AnimatedCounter";

interface SpendingData {
  lastUpdated: string;
  release: number;
  currency: string;
  unit: string;
  donors: number;
  totals: {
    military: number;
    financial: number;
    humanitarian: number;
    total: number;
  };
  byCountry: {
    country: string;
    euMember: boolean;
    financial: number;
    humanitarian: number;
    military: number;
    total: number;
  }[];
  byMonth: {
    date: string;
    military: number;
    humanitarian: number;
    financial: number;
    total: number;
  }[];
  cumulative: {
    date: string;
    military: number;
    financial: number;
    humanitarian: number;
    total: number;
  }[];
  topWeapons: { name: string; count: number }[];
  source: { name: string; url: string; release: string };
}

function formatEUR(n: number): string {
  if (n >= 100) return `€${n.toFixed(0)}B`;
  if (n >= 10) return `€${n.toFixed(1)}B`;
  if (n >= 1) return `€${n.toFixed(2)}B`;
  if (n >= 0.01) return `€${(n * 1000).toFixed(0)}M`;
  return `€${(n * 1000).toFixed(1)}M`;
}

interface SpendingPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string;
}

export default function SpendingPanel({
  isOpen,
  onToggle,
  timelineDate,
}: SpendingPanelProps) {
  const [data, setData] = useState<SpendingData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spending")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const timelineTotals = useMemo(() => {
    if (!data || !timelineDate) return null;
    const norm =
      timelineDate.length === 8
        ? `${timelineDate.slice(0, 4)}-${timelineDate.slice(4, 6)}`
        : timelineDate.slice(0, 7);

    let found = null;
    for (const c of data.cumulative) {
      if (c.date <= norm) found = c;
      else break;
    }
    return found;
  }, [data, timelineDate]);

  const displayTotals = timelineTotals || data?.totals;

  if (!isOpen) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "overflow-hidden"
        )}
      >
        <div className="drag-handle flex items-center gap-1.5 px-2.5 py-1.5 cursor-grab active:cursor-grabbing flex-1">
          <TbCurrencyEuro className="h-3.5 w-3.5 text-ua-yellow" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Aid & Spending
          </span>
        </div>
        <button
          onClick={onToggle}
          className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3 w-3 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-[calc(100vw-1.5rem)] sm:w-64",
        "max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]",
        "overflow-y-auto",
        "rounded-lg",
        "bg-background/85 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="drag-handle flex items-center gap-1.5 cursor-grab active:cursor-grabbing flex-1">
          <TbCurrencyEuro className="h-3.5 w-3.5 text-ua-yellow" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
            Aid & Spending
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading || !data ? (
        <div className="p-3 text-center">
          <div className="text-[10px] text-muted-foreground animate-pulse">
            Loading aid data...
          </div>
        </div>
      ) : (
        <div className="p-2.5 space-y-2.5">
          {/* Total Aid */}
          <div className="text-center pb-1.5 border-b border-border/20">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
              {timelineTotals ? "Cumulative Aid" : "Total Bilateral Aid"}
            </div>
            <div className="text-xl font-bold text-ua-yellow font-mono tabular-nums">
              €
              <AnimatedCounter
                value={Math.round((displayTotals?.total ?? 0) * 10) / 10}
                duration={1200}
                decimals={1}
              />
              B
            </div>
            <div className="text-[8px] text-muted-foreground mt-0.5">
              {data.donors} donor countries · {data.source.release}
            </div>
          </div>

          {/* Breakdown by type */}
          <div className="space-y-1.5">
            <AidTypeRow
              icon={<TbShieldCheckered className="h-3 w-3 text-destruction" />}
              label="Military"
              value={displayTotals?.military ?? 0}
              total={displayTotals?.total ?? 1}
              color="bg-destruction/60"
            />
            <AidTypeRow
              icon={<TbBuildingBank className="h-3 w-3 text-ua-blue-light" />}
              label="Financial"
              value={displayTotals?.financial ?? 0}
              total={displayTotals?.total ?? 1}
              color="bg-ua-blue/60"
            />
            <AidTypeRow
              icon={<TbHeartHandshake className="h-3 w-3 text-capture" />}
              label="Humanitarian"
              value={displayTotals?.humanitarian ?? 0}
              total={displayTotals?.total ?? 1}
              color="bg-capture/60"
            />
          </div>

          {/* Top Donors (expandable) */}
          <div>
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "donors" ? null : "donors"
                )
              }
              className="flex items-center gap-1 w-full text-left"
            >
              {expandedSection === "donors" ? (
                <TbChevronUp className="h-2.5 w-2.5 text-muted-foreground" />
              ) : (
                <TbChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
              )}
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Top Donors
              </span>
            </button>
            {expandedSection === "donors" && (
              <div className="mt-1.5 space-y-1">
                {data.byCountry.slice(0, 10).map((c) => (
                  <div key={c.country} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-20 truncate text-right">
                      {c.country}
                    </span>
                    <div className="flex-1 h-2 bg-surface-elevated/50 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-ua-yellow/40 rounded-sm"
                        style={{
                          width: `${(c.total / data.byCountry[0].total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-foreground/70 w-12 text-right font-mono">
                      {formatEUR(c.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Trend (mini sparkline) */}
          {data.byMonth.length > 0 && (
            <div>
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "trend" ? null : "trend"
                  )
                }
                className="flex items-center gap-1 w-full text-left"
              >
                {expandedSection === "trend" ? (
                  <TbChevronUp className="h-2.5 w-2.5 text-muted-foreground" />
                ) : (
                  <TbChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                )}
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  Monthly Trend
                </span>
              </button>
              {expandedSection === "trend" && (
                <div className="mt-1.5">
                  <MiniBarChart months={data.byMonth} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source footer */}
      {data && (
        <div className="px-2.5 pb-2 pt-0.5">
          <div className="text-[8px] text-muted-foreground/50">
            Source: {data.source.name} · {data.source.release}
          </div>
        </div>
      )}
    </div>
  );
}

function AidTypeRow({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-[9px] text-muted-foreground">{label}</span>
          <span className="text-[10px] font-mono text-foreground/80 tabular-nums">
            {formatEUR(value)}
          </span>
        </div>
        <div className="h-1.5 bg-surface-elevated/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              color
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ months }: { months: SpendingData["byMonth"] }) {
  const maxVal = Math.max(...months.map((m) => m.total));
  return (
    <div className="flex items-end gap-px h-16">
      {months.map((m) => {
        const milH = maxVal > 0 ? (m.military / maxVal) * 100 : 0;
        const finH = maxVal > 0 ? (m.financial / maxVal) * 100 : 0;
        const humH = maxVal > 0 ? (m.humanitarian / maxVal) * 100 : 0;
        return (
          <div
            key={m.date}
            className="flex-1 flex flex-col justify-end gap-px min-w-0 group relative"
            title={`${m.date}: ${formatEUR(m.total)}`}
          >
            <div
              className="bg-destruction/50 rounded-t-sm min-h-0"
              style={{ height: `${milH}%` }}
            />
            <div
              className="bg-ua-blue/50 min-h-0"
              style={{ height: `${finH}%` }}
            />
            <div
              className="bg-capture/50 rounded-b-sm min-h-0"
              style={{ height: `${humH}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
