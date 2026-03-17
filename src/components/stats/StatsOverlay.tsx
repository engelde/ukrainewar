"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import AnimatedCounter from "./AnimatedCounter";
import Sparkline from "./Sparkline";
import type { CasualtyData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GiTank, GiRocket, GiHelicopter, GiBattleship } from "react-icons/gi";
import { TbUsers, TbBomb, TbDrone, TbRadar, TbPlane, TbTruck, TbShieldChevron, TbChevronDown } from "react-icons/tb";

interface StatsEntry {
  key: string;
  label: string;
  daily: number;
  total: number;
  icon: ReactNode;
  trendKey: string;
}

interface TrendData {
  totalTrend: { date: string; count: number }[];
  typeTrends: Record<string, { date: string; count: number }[]>;
}

function mapCasualtyData(data: CasualtyData): StatsEntry[] {
  const iconClass = "h-4 w-4";
  return [
    {
      key: "personnel",
      label: "Personnel",
      daily: data.militaryPersonnel[0],
      total: data.militaryPersonnel[1],
      icon: <TbUsers className={iconClass} />,
      trendKey: "_total",
    },
    {
      key: "tanks",
      label: "Tanks",
      daily: data.tank[0],
      total: data.tank[1],
      icon: <GiTank className={iconClass} />,
      trendKey: "tanks",
    },
    {
      key: "ifv",
      label: "Armored Vehicles",
      daily: data.armoredCombatVehicle[0],
      total: data.armoredCombatVehicle[1],
      icon: <TbShieldChevron className={iconClass} />,
      trendKey: "ifv",
    },
    {
      key: "artillery",
      label: "Artillery",
      daily: data.artillerySystem[0],
      total: data.artillerySystem[1],
      icon: <TbBomb className={iconClass} />,
      trendKey: "artillery",
    },
    {
      key: "mlrs",
      label: "MLRS",
      daily: data.mlrs[0],
      total: data.mlrs[1],
      icon: <GiRocket className={iconClass} />,
      trendKey: "mlrs",
    },
    {
      key: "uav",
      label: "UAVs",
      daily: data.uav[0],
      total: data.uav[1],
      icon: <TbDrone className={iconClass} />,
      trendKey: "uav",
    },
    {
      key: "airDefense",
      label: "Air Defense",
      daily: data.airDefenceSystem[0],
      total: data.airDefenceSystem[1],
      icon: <TbRadar className={iconClass} />,
      trendKey: "airDefense",
    },
    {
      key: "jets",
      label: "Jets",
      daily: data.jet[0],
      total: data.jet[1],
      icon: <TbPlane className={iconClass} />,
      trendKey: "jets",
    },
    {
      key: "helicopters",
      label: "Helicopters",
      daily: data.copter[0],
      total: data.copter[1],
      icon: <GiHelicopter className={iconClass} />,
      trendKey: "helicopters",
    },
    {
      key: "vehicles",
      label: "Vehicles",
      daily: data.supplyVehicle[0],
      total: data.supplyVehicle[1],
      icon: <TbTruck className={iconClass} />,
      trendKey: "vehicles",
    },
    {
      key: "ships",
      label: "Ships",
      daily: data.ship[0],
      total: data.ship[1],
      icon: <GiBattleship className={iconClass} />,
      trendKey: "ships",
    },
  ];
}

const TREND_COLORS: Record<string, string> = {
  _total: "#e53e3e",
  tanks: "#e53e3e",
  ifv: "#ed8936",
  artillery: "#ed8936",
  mlrs: "#d69e2e",
  uav: "#3d8fd6",
  airDefense: "#9f7aea",
  jets: "#3d8fd6",
  helicopters: "#3d8fd6",
  vehicles: "#48bb78",
  ships: "#4a90d9",
};

interface StatsOverlayProps {
  data: CasualtyData;
  isHistorical?: boolean;
}

export default function StatsOverlay({ data, isHistorical }: StatsOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const stats = mapCasualtyData(data);
  const warDay = data.day;

  useEffect(() => {
    let cancelled = false;
    async function loadTrend() {
      try {
        const res = await fetch("/api/losses/trend");
        if (res.ok && !cancelled) {
          const json = await res.json();
          setTrendData(json);
        }
      } catch {
        // Silently fail — sparklines are supplementary
      }
    }
    loadTrend();
    return () => {
      cancelled = true;
    };
  }, []);

  const getTrendValues = (trendKey: string): number[] => {
    if (!trendData) return [];
    if (trendKey === "_total") {
      return trendData.totalTrend.map((d) => d.count);
    }
    const trend = trendData.typeTrends[trendKey];
    if (!trend) return [];
    return trend.map((d) => d.count);
  };

  const getTrendDates = (): string[] => {
    if (!trendData) return [];
    return trendData.totalTrend.map((d) => d.date);
  };

  return (
    <div
      className={cn(
        "flex flex-col transition-all duration-300",
        collapsed && "w-auto"
      )}
    >
      {/* Collapsed state — compact bar with expand indicator */}
      {collapsed && (
        <div
          className={cn(
            "flex items-center rounded-lg",
            "bg-background/80 backdrop-blur-xl",
            "border border-border/50",
            "overflow-hidden"
          )}
        >
          <div className="drag-handle flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing flex-1">
            {!isHistorical && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ua-blue opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ua-blue" />
              </span>
            )}
            {isHistorical && (
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ua-yellow" />
              </span>
            )}
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              isHistorical ? "text-ua-yellow" : "text-ua-blue"
            )}>
              Russian Losses
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Day {warDay}
            </span>
          </div>
          <button
            onClick={() => setCollapsed(false)}
            className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <TbChevronDown className="h-3 w-3 rotate-180" />
          </button>
        </div>
      )}

      {/* Expanded state */}
      {!collapsed && (
        <>
          {/* Header — drag handle with separate collapse button */}
          <div
            className={cn(
              "flex items-center rounded-t-lg",
              "bg-background/80 backdrop-blur-xl",
              "border border-b-0 border-border/50",
              "overflow-hidden"
            )}
          >
            <div className={cn(
              "drag-handle flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing flex-1",
              "text-xs font-semibold uppercase tracking-wider",
              isHistorical ? "text-ua-yellow" : "text-ua-blue"
            )}>
              {!isHistorical && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ua-blue opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ua-blue" />
                </span>
              )}
              {isHistorical && (
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ua-yellow" />
                </span>
              )}
              <span>Russian Losses</span>
              <span className="ml-auto text-muted-foreground">
                Day {warDay}
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <TbChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Stats list */}
          <div
            className={cn(
              "flex flex-col rounded-b-lg",
              "bg-background/80 backdrop-blur-xl",
              "border border-t-0 border-border/50",
              "overflow-hidden"
            )}
          >
          {stats.map((stat) => {
            const isExpanded = expandedKey === stat.key;
            const trendValues = getTrendValues(stat.trendKey);
            const hasTrend = trendValues.length > 2;
            const dates = getTrendDates();

            return (
              <div key={stat.key}>
                <button
                  onClick={() =>
                    setExpandedKey(isExpanded ? null : stat.key)
                  }
                  className={cn(
                    "group flex w-full items-center gap-2 px-3 py-1.5",
                    "border-b border-border/30 last:border-b-0",
                    "hover:bg-surface-elevated/50 transition-colors",
                    isExpanded && "bg-surface-elevated/30"
                  )}
                >
                  <span className="flex w-5 items-center justify-center text-muted-foreground">
                    {stat.icon}
                  </span>
                  <span className="min-w-[85px] text-left text-xs text-muted-foreground sm:min-w-[100px]">
                    {stat.label}
                  </span>
                  <AnimatedCounter
                    value={stat.total}
                    className="ml-auto text-sm font-bold text-foreground"
                  />
                  {stat.daily > 0 && (
                    <span className="text-[10px] font-medium text-destruction">
                      +{stat.daily.toLocaleString()}
                    </span>
                  )}
                </button>
                {/* Expanded sparkline */}
                {isExpanded && (
                  <div
                    className={cn(
                      "border-b border-border/30 bg-surface/40 px-3 py-2",
                      "animate-in slide-in-from-top-2 fade-in duration-200"
                    )}
                  >
                    {hasTrend ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            Confirmed losses · last {dates.length} days
                          </span>
                          <span className="text-[10px] font-medium" style={{ color: TREND_COLORS[stat.trendKey] || "#3d8fd6" }}>
                            {trendValues.reduce((a, b) => a + b, 0)} total
                          </span>
                        </div>
                        <Sparkline
                          data={trendValues}
                          width={200}
                          height={32}
                          color={TREND_COLORS[stat.trendKey] || "#3d8fd6"}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[9px] text-muted-foreground/60">
                          <span>{dates[0]?.slice(5)}</span>
                          <span>{dates[dates.length - 1]?.slice(5)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        No trend data available
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
