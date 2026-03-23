"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  TbBuildingBank,
  TbChevronDown,
  TbChevronUp,
  TbCurrencyEuro,
  TbHeartHandshake,
  TbShieldCheckered,
} from "react-icons/tb";
import { AnimatedCounter } from "@/components/stats/AnimatedCounter";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

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

function SpendingPanelInner({ isOpen, onToggle, timelineDate }: SpendingPanelProps) {
  const [data, setData] = useState<SpendingData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("trend");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const r = await fetch("/api/spending", { signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (d?.byMonth && d.cumulative) setData(d);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError")
          console.error("Spending fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
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

  // Filter monthly bar chart data to timeline position
  const displayMonths = useMemo(() => {
    if (!data?.byMonth) return [];
    if (!timelineDate) return data.byMonth;
    const norm =
      timelineDate.length === 8
        ? `${timelineDate.slice(0, 4)}-${timelineDate.slice(4, 6)}`
        : timelineDate.slice(0, 7);
    return data.byMonth.filter((m) => m.date <= norm);
  }, [data?.byMonth, timelineDate]);

  const displayTotals = timelineTotals || data?.totals;

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
          <TbCurrencyEuro className="h-3.5 w-3.5 text-capture" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-capture">
            {t("spending.title")}
          </span>
        </div>
        <button
          onClick={onToggle}
          aria-label="Expand spending panel"
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
        "scrollbar-thin scrollbar-thumb-border/30",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="drag-handle flex items-center gap-1.5 cursor-grab active:cursor-grabbing flex-1">
          <TbCurrencyEuro className="h-3.5 w-3.5 text-capture" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-capture">
            {t("spending.title")}
          </span>
        </div>
        <button
          onClick={onToggle}
          aria-label="Close spending panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading || !data ? (
        <PanelSkeleton rows={3} />
      ) : (
        <div className="p-2.5 space-y-2.5">
          {/* Total Aid */}
          <div className="text-center pb-1.5 border-b border-border/20">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
              {timelineTotals ? t("spending.cumulativeAid") : t("spending.totalBilateralAid")}
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
              {t("spending.donorCountries", { count: data.donors })} · {data.source.release}
            </div>
          </div>

          {/* Breakdown by type */}
          <div className="space-y-1.5">
            <AidTypeRow
              icon={<TbShieldCheckered className="h-3 w-3 text-destruction" />}
              label={t("spending.military")}
              value={displayTotals?.military ?? 0}
              total={displayTotals?.total ?? 1}
              color="bg-destruction/60"
            />
            <AidTypeRow
              icon={<TbBuildingBank className="h-3 w-3 text-ua-blue-light" />}
              label={t("spending.financial")}
              value={displayTotals?.financial ?? 0}
              total={displayTotals?.total ?? 1}
              color="bg-ua-blue/60"
            />
            <AidTypeRow
              icon={<TbHeartHandshake className="h-3 w-3 text-capture" />}
              label={t("spending.humanitarian")}
              value={displayTotals?.humanitarian ?? 0}
              total={displayTotals?.total ?? 1}
              color="bg-capture/60"
            />
          </div>

          {/* Top Donors (expandable) */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === "donors" ? null : "donors")}
              className="flex items-center gap-1 w-full text-left"
            >
              {expandedSection === "donors" ? (
                <TbChevronUp className="h-2.5 w-2.5 text-muted-foreground" />
              ) : (
                <TbChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
              )}
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                {t("spending.topDonors")}
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
                onClick={() => setExpandedSection(expandedSection === "trend" ? null : "trend")}
                className="flex items-center gap-1 w-full text-left"
              >
                {expandedSection === "trend" ? (
                  <TbChevronUp className="h-2.5 w-2.5 text-muted-foreground" />
                ) : (
                  <TbChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                )}
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  {t("spending.monthlyTrend")}
                </span>
              </button>
              {expandedSection === "trend" && (
                <div className="mt-1.5">
                  <MiniBarChart months={displayMonths} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source footer */}
      {data && (
        <div className="px-3 py-1.5 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/50">
            <span>{t("common.source")}:</span>
            <a
              href="https://www.ifw-kiel.de/topics/war-against-ukraine/ukraine-support-tracker/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ua-blue transition-colors"
            >
              {data.source.name}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const SpendingPanel = memo(SpendingPanelInner);
export default SpendingPanel;

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
            className={cn("h-full rounded-full transition-all duration-700", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ months }: { months: SpendingData["byMonth"] }) {
  if (!months || months.length === 0) return null;
  const maxTotal = Math.max(...months.map((m) => m.total));
  if (maxTotal === 0) return null;
  const BAR_HEIGHT = 64;
  // sqrt scale so smaller months are visible relative to the peak
  const sqrtMax = Math.sqrt(maxTotal);
  return (
    <div className="flex items-end gap-px" style={{ height: `${BAR_HEIGHT}px` }}>
      {months.map((m) => {
        const ratio = Math.sqrt(m.total) / sqrtMax;
        const totalPx = ratio * BAR_HEIGHT;
        const milFrac = m.total > 0 ? m.military / m.total : 0;
        const finFrac = m.total > 0 ? m.financial / m.total : 0;
        const humFrac = 1 - milFrac - finFrac;
        const milH = Math.round(totalPx * milFrac);
        const finH = Math.round(totalPx * finFrac);
        const humH = Math.max(Math.round(totalPx * humFrac), 0);
        return (
          <div
            key={m.date}
            className="flex-1 flex flex-col justify-end min-w-0"
            title={`${m.date}: ${formatEUR(m.total)}`}
          >
            {milH >= 1 && (
              <div className="bg-destruction rounded-t-sm" style={{ height: `${milH}px` }} />
            )}
            {finH >= 1 && <div className="bg-ua-blue-light" style={{ height: `${finH}px` }} />}
            {humH >= 1 && (
              <div className="bg-capture rounded-b-sm" style={{ height: `${humH}px` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
