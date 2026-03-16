"use client";

import { useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import type { CasualtyData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatsEntry {
  key: string;
  label: string;
  daily: number;
  total: number;
  icon: string;
}

function mapCasualtyData(data: CasualtyData): StatsEntry[] {
  return [
    {
      key: "personnel",
      label: "Personnel",
      daily: data.militaryPersonnel[0],
      total: data.militaryPersonnel[1],
      icon: "👤",
    },
    {
      key: "tanks",
      label: "Tanks",
      daily: data.tank[0],
      total: data.tank[1],
      icon: "🛡",
    },
    {
      key: "ifv",
      label: "Armored Vehicles",
      daily: data.armoredCombatVehicle[0],
      total: data.armoredCombatVehicle[1],
      icon: "🚛",
    },
    {
      key: "artillery",
      label: "Artillery",
      daily: data.artillerySystem[0],
      total: data.artillerySystem[1],
      icon: "💥",
    },
    {
      key: "mlrs",
      label: "MLRS",
      daily: data.mlrs[0],
      total: data.mlrs[1],
      icon: "🚀",
    },
    {
      key: "uav",
      label: "UAVs",
      daily: data.uav[0],
      total: data.uav[1],
      icon: "✈",
    },
    {
      key: "airDefense",
      label: "Air Defense",
      daily: data.airDefenceSystem[0],
      total: data.airDefenceSystem[1],
      icon: "🎯",
    },
    {
      key: "jets",
      label: "Jets",
      daily: data.jet[0],
      total: data.jet[1],
      icon: "✈",
    },
    {
      key: "helicopters",
      label: "Helicopters",
      daily: data.copter[0],
      total: data.copter[1],
      icon: "🚁",
    },
    {
      key: "vehicles",
      label: "Vehicles",
      daily: data.supplyVehicle[0],
      total: data.supplyVehicle[1],
      icon: "🚚",
    },
    {
      key: "ships",
      label: "Ships",
      daily: data.ship[0],
      total: data.ship[1],
      icon: "🚢",
    },
  ];
}

interface StatsOverlayProps {
  data: CasualtyData;
}

export default function StatsOverlay({ data }: StatsOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const stats = mapCasualtyData(data);
  const warDay = data.day;

  return (
    <div
      className={cn(
        "fixed right-3 top-14 z-30 flex flex-col transition-all duration-300",
        "sm:right-4 sm:top-16",
        collapsed && "w-auto"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "flex items-center gap-2 rounded-t-lg px-3 py-2",
          "bg-background/80 backdrop-blur-xl",
          "border border-b-0 border-border/50",
          "text-xs font-semibold uppercase tracking-wider text-ua-blue",
          "hover:bg-background/90 transition-colors",
          collapsed && "rounded-b-lg border-b"
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ua-blue opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ua-blue" />
        </span>
        <span>Russian Losses</span>
        <span className="ml-auto text-muted-foreground">
          Day {warDay}
        </span>
        <svg
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            collapsed && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Stats list */}
      {!collapsed && (
        <div
          className={cn(
            "flex flex-col rounded-b-lg",
            "bg-background/80 backdrop-blur-xl",
            "border border-t-0 border-border/50",
            "overflow-hidden"
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.key}
              className={cn(
                "group flex items-center gap-2 px-3 py-1.5",
                "border-b border-border/30 last:border-b-0",
                "hover:bg-surface-elevated/50 transition-colors cursor-default"
              )}
            >
              <span className="w-5 text-center text-sm">{stat.icon}</span>
              <span className="min-w-[85px] text-xs text-muted-foreground sm:min-w-[100px]">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
