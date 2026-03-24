"use client";

import { memo, useMemo } from "react";
import {
  TbChevronDown,
  TbDrone,
  TbRocket,
  TbShieldChevron,
  TbSkull,
  TbUrgent,
} from "react-icons/tb";
import { ATTACK_STATS, MISSILE_ATTACKS, type MissileAttack } from "@/data/missile-attacks";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

interface AirDefensePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string;
}

function formatNumber(n: number): string {
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

function pct(intercepted: number, launched: number): number {
  return launched > 0 ? Math.round((intercepted / launched) * 100) : 0;
}

function computeFilteredStats(attacks: MissileAttack[]) {
  let totalMissilesLaunched = 0;
  let totalMissilesIntercepted = 0;
  let totalDronesLaunched = 0;
  let totalDronesIntercepted = 0;
  let totalMassiveAttacks = 0;
  let totalKilled = 0;
  let totalInjured = 0;

  for (const a of attacks) {
    totalMissilesLaunched += a.missiles.launched;
    totalMissilesIntercepted += a.missiles.intercepted;
    totalDronesLaunched += a.drones.launched;
    totalDronesIntercepted += a.drones.intercepted;
    if (a.type === "massive") totalMassiveAttacks++;
    if (a.casualties) {
      totalKilled += a.casualties.killed;
      totalInjured += a.casualties.injured;
    }
  }

  return {
    totalMissilesLaunched,
    totalMissilesIntercepted,
    totalDronesLaunched,
    totalDronesIntercepted,
    totalMassiveAttacks,
    totalKilled,
    totalInjured,
  };
}

function AirDefensePanelInner({ isOpen, onToggle, timelineDate }: AirDefensePanelProps) {
  const filteredAttacks = useMemo(() => {
    if (!timelineDate) return MISSILE_ATTACKS;
    const norm = timelineDate.length === 8 ? timelineDate : timelineDate.replace(/-/g, "");
    return MISSILE_ATTACKS.filter((a) => a.date <= norm);
  }, [timelineDate]);

  const stats = useMemo(() => {
    if (!timelineDate) {
      // Use precomputed stats + compute casualties
      let totalKilled = 0;
      let totalInjured = 0;
      for (const a of MISSILE_ATTACKS) {
        if (a.casualties) {
          totalKilled += a.casualties.killed;
          totalInjured += a.casualties.injured;
        }
      }
      return { ...ATTACK_STATS, totalKilled, totalInjured };
    }
    return computeFilteredStats(filteredAttacks);
  }, [timelineDate, filteredAttacks]);

  const missileRate = pct(stats.totalMissilesIntercepted, stats.totalMissilesLaunched);
  const droneRate = pct(stats.totalDronesIntercepted, stats.totalDronesLaunched);

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
          <TbShieldChevron className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-cyan-400">
            {t("airDefense.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand air defense panel"
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
          <TbShieldChevron className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-cyan-400">
            {t("airDefense.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close air defense panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-2.5 space-y-2.5">
        {/* Summary stats grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatCard
            icon={<TbRocket className="h-3 w-3 text-destruction" />}
            label={t("airDefense.missilesLaunched")}
            value={formatNumber(stats.totalMissilesLaunched)}
            sub={`${missileRate}% intercepted`}
          />
          <StatCard
            icon={<TbDrone className="h-3 w-3 text-cyan-400" />}
            label={t("airDefense.dronesLaunched")}
            value={formatNumber(stats.totalDronesLaunched)}
            sub={`${droneRate}% intercepted`}
          />
          <StatCard
            icon={<TbUrgent className="h-3 w-3 text-red-400" />}
            label={t("airDefense.majorAttacks")}
            value={String(stats.totalMassiveAttacks)}
            sub="50+ projectiles"
          />
          <StatCard
            icon={<TbSkull className="h-3 w-3 text-muted-foreground" />}
            label="Casualties"
            value={formatNumber(stats.totalKilled + stats.totalInjured)}
            sub={`${stats.totalKilled} killed · ${stats.totalInjured} injured`}
          />
        </div>

        {/* Interception rate bars */}
        <div className="space-y-1.5 pt-1 border-t border-border/20">
          <div className="text-[0.5625rem] text-muted-foreground uppercase tracking-wider">
            {t("airDefense.interceptionRate")}
          </div>
          <InterceptionBar
            label="Missiles"
            intercepted={stats.totalMissilesIntercepted}
            launched={stats.totalMissilesLaunched}
          />
          <InterceptionBar
            label="Drones"
            intercepted={stats.totalDronesIntercepted}
            launched={stats.totalDronesLaunched}
          />
        </div>
      </div>

      {/* Source footer */}
      <div className="px-3 py-1.5 border-t border-border/30">
        <div className="text-[0.5rem] text-muted-foreground/50">
          {t("common.source")}: {t("airDefense.source")}
        </div>
      </div>
    </div>
  );
}

const AirDefensePanel = memo(AirDefensePanelInner);
export default AirDefensePanel;

// ─── Sub-components ──────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-[0.5625rem] text-muted-foreground truncate">{label}</span>
      </div>
      <div className="text-sm font-bold font-mono tabular-nums text-foreground">{value}</div>
      <div className="text-[0.5rem] text-muted-foreground/70 truncate">{sub}</div>
    </div>
  );
}

function InterceptionBar({
  label,
  intercepted,
  launched,
}: {
  label: string;
  intercepted: number;
  launched: number;
}) {
  const rate = launched > 0 ? (intercepted / launched) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-[0.5625rem] text-muted-foreground">{label}</span>
        <span className="text-[0.5625rem] font-mono tabular-nums text-foreground/70">
          {intercepted}/{launched}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex bg-white/5">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${rate}%`,
            backgroundColor: "#48BB78",
          }}
        />
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${100 - rate}%`,
            backgroundColor: "#E53E3E",
          }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[0.5rem] font-mono" style={{ color: "#48BB78" }}>
          {rate.toFixed(1)}% intercepted
        </span>
        <span className="text-[0.5rem] font-mono" style={{ color: "#E53E3E" }}>
          {(100 - rate).toFixed(1)}% hit
        </span>
      </div>
    </div>
  );
}
