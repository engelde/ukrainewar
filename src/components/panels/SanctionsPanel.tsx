"use client";

import { memo, useMemo } from "react";
import { TbChevronDown, TbGavel, TbScale } from "react-icons/tb";
import {
  getSanctionsByDate,
  SANCTIONS_PACKAGES,
  SANCTIONS_SUMMARY,
  type SanctionsPackage,
} from "@/data/sanctions";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

interface SanctionsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string; // YYYYMMDD
}

const IMPOSER_COLORS: Record<string, string> = {
  EU: "bg-blue-500",
  US: "bg-indigo-500",
  UK: "bg-red-500",
  Canada: "bg-red-400",
  Japan: "bg-rose-400",
  Australia: "bg-emerald-500",
  Switzerland: "bg-orange-400",
};

function formatNumber(n: number): string {
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

function computeFilteredSummary(packages: SanctionsPackage[]) {
  const byImposer: Record<string, number> = {};
  let totalIndividuals = 0;
  let totalEntities = 0;

  for (const pkg of packages) {
    byImposer[pkg.imposedBy] = (byImposer[pkg.imposedBy] ?? 0) + 1;
    totalIndividuals += pkg.targets.individuals;
    totalEntities += pkg.targets.entities;
  }

  return {
    totalPackages: packages.length,
    totalIndividualsSanctioned: totalIndividuals,
    totalEntitiesSanctioned: totalEntities,
    byImposer,
    keyBans: SANCTIONS_SUMMARY.keyBans,
  };
}

function SanctionsPanelInner({ isOpen, onToggle, timelineDate }: SanctionsPanelProps) {
  const filteredPackages = useMemo(() => {
    if (!timelineDate) return SANCTIONS_PACKAGES;
    const norm = timelineDate.length === 8 ? timelineDate : timelineDate.replace(/-/g, "");
    return getSanctionsByDate(norm);
  }, [timelineDate]);

  const summary = useMemo(() => {
    if (!timelineDate) return SANCTIONS_SUMMARY;
    return computeFilteredSummary(filteredPackages);
  }, [timelineDate, filteredPackages]);

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
          <TbScale className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            {t("sanctions.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sanctions panel"
          className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3 w-3 rotate-180" />
        </button>
      </div>
    );
  }

  const sortedImposers = Object.entries(summary.byImposer).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...sortedImposers.map(([, c]) => c));

  return (
    <div
      className={cn(
        "w-[calc(100vw-1.5rem)] sm:w-[320px]",
        "max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]",
        "overflow-y-auto",
        "rounded-xl",
        "bg-background/80 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30",
      )}
    >
      {/* Header */}
      <div className="drag-handle sticky top-0 z-10 bg-background/90 backdrop-blur-sm px-3 py-2 border-b border-border/30 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <TbScale className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            {t("sanctions.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close sanctions panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-2.5 space-y-2.5">
        {/* Summary stats grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <StatCard
            icon={<TbScale className="h-3 w-3 text-amber-400" />}
            label={t("sanctions.totalPackages")}
            value={String(summary.totalPackages)}
          />
          <StatCard
            icon={<TbGavel className="h-3 w-3 text-amber-400/70" />}
            label={t("sanctions.individuals")}
            value={formatNumber(summary.totalIndividualsSanctioned)}
          />
          <StatCard
            icon={<TbGavel className="h-3 w-3 text-amber-400/70" />}
            label={t("sanctions.entities")}
            value={formatNumber(summary.totalEntitiesSanctioned)}
          />
        </div>

        {/* By Imposer */}
        <div className="space-y-1.5 pt-1 border-t border-border/20">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {t("sanctions.byImposer")}
          </div>
          <div className="space-y-1">
            {sortedImposers.map(([name, count]) => (
              <ImposerBar key={name} name={name} count={count} max={maxCount} />
            ))}
          </div>
        </div>

        {/* Key Bans */}
        <div className="space-y-1 pt-1 border-t border-border/20">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {t("sanctions.keyBans")}
          </div>
          <ul className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-border/30">
            {summary.keyBans.map((ban) => (
              <li
                key={ban}
                className="flex items-start gap-1.5 rounded-lg bg-white/5 p-1.5 text-[9px] text-foreground/70 leading-tight"
              >
                <TbGavel className="mt-0.5 h-2.5 w-2.5 shrink-0 text-amber-400/60" />
                <span>{ban}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Source footer */}
      <div className="px-3 py-1.5 border-t border-border/30">
        <div className="text-[8px] text-muted-foreground/50">
          {t("common.source")}: {t("sanctions.source")}
        </div>
      </div>
    </div>
  );
}

const SanctionsPanel = memo(SanctionsPanelInner);
export default SanctionsPanel;

// ─── Sub-components ──────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-[9px] text-muted-foreground truncate">{label}</span>
      </div>
      <div className="text-sm font-bold font-mono tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function ImposerBar({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color = IMPOSER_COLORS[name] ?? "bg-zinc-500";

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[9px] text-muted-foreground truncate text-right">{name}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-4 text-[9px] font-mono tabular-nums text-foreground/70 text-right">
        {count}
      </span>
    </div>
  );
}
