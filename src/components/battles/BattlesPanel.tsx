"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  TbSwords,
  TbChevronDown,
  TbMapPin,
  TbCalendar,
  TbSkull,
} from "react-icons/tb";

export interface Battle {
  id: string;
  name: string;
  startDate: string; // YYYYMMDD
  endDate?: string; // YYYYMMDD, undefined if ongoing
  lat: number;
  lng: number;
  description: string;
  outcome?: string;
  significance: "critical" | "major" | "significant";
}

// Major battles of the Russo-Ukrainian War (2022-present)
export const MAJOR_BATTLES: Battle[] = [
  {
    id: "kyiv",
    name: "Battle of Kyiv",
    startDate: "20220224",
    endDate: "20220402",
    lat: 50.4501,
    lng: 30.5234,
    description:
      "Russian forces attempted to capture Kyiv from the north via Belarus. Ukraine successfully defended the capital, forcing a full Russian withdrawal.",
    outcome: "Ukrainian victory",
    significance: "critical",
  },
  {
    id: "kherson-capture",
    name: "Fall of Kherson",
    startDate: "20220224",
    endDate: "20220302",
    lat: 46.6354,
    lng: 32.6169,
    description:
      "Kherson was the first major Ukrainian city to fall to Russian forces, becoming a key strategic position on the Dnipro River.",
    outcome: "Russian capture",
    significance: "critical",
  },
  {
    id: "mariupol",
    name: "Siege of Mariupol",
    startDate: "20220224",
    endDate: "20220520",
    lat: 47.0951,
    lng: 37.5437,
    description:
      "Nearly 3-month siege of Mariupol. Azovstal steel plant became the last Ukrainian stronghold. Over 20,000 civilian casualties estimated.",
    outcome: "Russian capture after prolonged siege",
    significance: "critical",
  },
  {
    id: "hostomel",
    name: "Battle of Hostomel",
    startDate: "20220224",
    endDate: "20220401",
    lat: 50.5685,
    lng: 30.2115,
    description:
      "Russian airborne forces attempted to seize Antonov Airport on Day 1. Ukraine counterattacked, denying Russia a staging area near Kyiv.",
    outcome: "Ukrainian victory",
    significance: "major",
  },
  {
    id: "sumy",
    name: "Battle of Sumy",
    startDate: "20220224",
    endDate: "20220404",
    lat: 50.9077,
    lng: 34.7981,
    description:
      "Russian forces besieged Sumy from the northeast but failed to capture it. City was liberated when Russia withdrew from northern Ukraine.",
    outcome: "Ukrainian victory",
    significance: "major",
  },
  {
    id: "chernihiv",
    name: "Battle of Chernihiv",
    startDate: "20220224",
    endDate: "20220404",
    lat: 51.4982,
    lng: 31.2893,
    description:
      "Russian forces surrounded and besieged Chernihiv. Despite heavy bombardment, Ukrainian forces held the city until Russian withdrawal.",
    outcome: "Ukrainian victory",
    significance: "major",
  },
  {
    id: "severodonetsk",
    name: "Battle of Severodonetsk",
    startDate: "20220506",
    endDate: "20220625",
    lat: 48.9486,
    lng: 38.4939,
    description:
      "Intense urban fighting in the Donbas. Ukrainian forces eventually withdrew across the Siverskyi Donets River after heavy losses on both sides.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "lysychansk",
    name: "Battle of Lysychansk",
    startDate: "20220625",
    endDate: "20220703",
    lat: 48.9042,
    lng: 38.4381,
    description:
      "Fall of Lysychansk completed Russian control of Luhansk Oblast. Ukraine conducted an orderly withdrawal to preserve forces.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "kharkiv-offensive",
    name: "Kharkiv Counteroffensive",
    startDate: "20220906",
    endDate: "20221002",
    lat: 49.2328,
    lng: 37.2,
    description:
      "Stunning Ukrainian counteroffensive that liberated over 12,000 km² in weeks, including Izium and Kupiansk. Russia's fastest territorial loss.",
    outcome: "Major Ukrainian victory",
    significance: "critical",
  },
  {
    id: "kherson-liberation",
    name: "Liberation of Kherson",
    startDate: "20220829",
    endDate: "20221111",
    lat: 46.6354,
    lng: 32.6169,
    description:
      "Ukraine's southern counteroffensive culminated in the liberation of Kherson, the only regional capital captured by Russia. Russians withdrew across the Dnipro.",
    outcome: "Major Ukrainian victory",
    significance: "critical",
  },
  {
    id: "bakhmut",
    name: "Battle of Bakhmut",
    startDate: "20220801",
    endDate: "20230520",
    lat: 48.5955,
    lng: 38.0006,
    description:
      "Longest and bloodiest battle of the war. Wagner PMC forces captured the city after 10 months. Estimated 20,000-30,000 Russian casualties.",
    outcome: "Russian capture at enormous cost",
    significance: "critical",
  },
  {
    id: "vuhledar-2023",
    name: "Battles of Vuhledar (2023)",
    startDate: "20230124",
    endDate: "20230311",
    lat: 47.7779,
    lng: 37.2504,
    description:
      "Multiple failed Russian assaults on Vuhledar. Russian 155th Marine Brigade suffered catastrophic losses including dozens of vehicles.",
    outcome: "Ukrainian defensive victory",
    significance: "significant",
  },
  {
    id: "zaporizhia-offensive",
    name: "Zaporizhia Counteroffensive",
    startDate: "20230608",
    endDate: "20231031",
    lat: 47.3,
    lng: 36.0,
    description:
      "Ukraine's summer 2023 counteroffensive aimed at cutting the land bridge to Crimea. Progress was slow through dense Russian minefields and fortifications.",
    outcome: "Limited Ukrainian gains",
    significance: "critical",
  },
  {
    id: "avdiivka",
    name: "Battle of Avdiivka",
    startDate: "20231010",
    endDate: "20240217",
    lat: 48.1405,
    lng: 37.7472,
    description:
      "4-month battle for the heavily fortified town. Russia eventually captured it after Ukraine withdrew to avoid encirclement. Massive Russian casualties.",
    outcome: "Russian capture",
    significance: "critical",
  },
  {
    id: "robotyne",
    name: "Battle of Robotyne",
    startDate: "20230804",
    endDate: "20231130",
    lat: 47.4423,
    lng: 35.8306,
    description:
      "Key engagement during Ukraine's southern counteroffensive. Ukraine captured Robotyne and advanced toward the Surovikin Line.",
    outcome: "Ukrainian capture, later contested",
    significance: "significant",
  },
  {
    id: "kursk",
    name: "Kursk Incursion",
    startDate: "20240806",
    endDate: "20250309",
    lat: 51.3,
    lng: 35.1,
    description:
      "Bold Ukrainian cross-border offensive into Russia's Kursk Oblast. Ukraine captured ~1,300 km² of Russian territory before eventual Russian recapture.",
    outcome: "Initial Ukrainian success, later Russian recapture",
    significance: "critical",
  },
  {
    id: "pokrovsk",
    name: "Battle of Pokrovsk",
    startDate: "20240701",
    endDate: undefined,
    lat: 48.2862,
    lng: 37.1833,
    description:
      "Russian offensive toward the strategic logistics hub of Pokrovsk. One of the most active frontline sectors with heavy daily fighting.",
    outcome: "Ongoing",
    significance: "critical",
  },
  {
    id: "vuhledar-fall",
    name: "Fall of Vuhledar",
    startDate: "20240901",
    endDate: "20241002",
    lat: 47.7779,
    lng: 37.2504,
    description:
      "After successfully defending since 2022, Ukrainian forces withdrew from Vuhledar following a Russian flanking maneuver.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "kurakhove",
    name: "Battle of Kurakhove",
    startDate: "20241101",
    endDate: "20250106",
    lat: 47.9833,
    lng: 37.3,
    description:
      "Russian forces captured the town after an extended siege, continuing the slow advance in Donetsk Oblast.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "chasiv-yar",
    name: "Battle of Chasiv Yar",
    startDate: "20240401",
    endDate: "20250715",
    lat: 48.6,
    lng: 37.85,
    description:
      "Strategically elevated city west of Bakhmut. Prolonged Russian assault, fiercely defended by Ukraine due to its commanding terrain.",
    outcome: "Russian capture after extended siege",
    significance: "critical",
  },
];

interface BattlesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string;
  onBattleClick?: (battle: Battle) => void;
}

export default function BattlesPanel({
  isOpen,
  onToggle,
  timelineDate,
  onBattleClick,
}: BattlesPanelProps) {
  const [selectedBattle, setSelectedBattle] = useState<string | null>(null);

  // Filter battles that are active at or before the timeline date
  const activeBattles = useMemo(() => {
    if (!timelineDate) return MAJOR_BATTLES;
    return MAJOR_BATTLES.filter((b) => b.startDate <= timelineDate);
  }, [timelineDate]);

  // Determine which battles are currently active (ongoing at timeline date)
  const currentlyActive = useMemo(() => {
    if (!timelineDate) return new Set<string>();
    return new Set(
      MAJOR_BATTLES.filter(
        (b) =>
          b.startDate <= timelineDate &&
          (!b.endDate || b.endDate >= timelineDate)
      ).map((b) => b.id)
    );
  }, [timelineDate]);

  const handleBattleClick = useCallback(
    (battle: Battle) => {
      setSelectedBattle(selectedBattle === battle.id ? null : battle.id);
      onBattleClick?.(battle);
    },
    [selectedBattle, onBattleClick]
  );

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
          <TbSwords className="h-3.5 w-3.5 text-destruction" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Major Battles
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
        "w-[calc(100vw-1.5rem)] sm:w-72",
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
          <TbSwords className="h-3.5 w-3.5 text-destruction" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
            Major Battles
          </span>
          <span className="text-[9px] text-muted-foreground ml-auto mr-2">
            {activeBattles.length} / {MAJOR_BATTLES.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Battle list */}
      <div className="p-1.5 space-y-0.5">
        {activeBattles.map((battle) => {
          const isActive = currentlyActive.has(battle.id);
          const isSelected = selectedBattle === battle.id;
          return (
            <button
              key={battle.id}
              onClick={() => handleBattleClick(battle)}
              className={cn(
                "w-full text-left rounded-md px-2 py-1.5 transition-all",
                "hover:bg-surface-elevated/50",
                isSelected && "bg-surface-elevated/60 border border-border/30",
                isActive && "ring-1 ring-destruction/30"
              )}
            >
              <div className="flex items-start gap-2">
                {/* Status indicator */}
                <div className="mt-0.5 flex-shrink-0">
                  {isActive ? (
                    <div className="h-2 w-2 rounded-full bg-destruction animate-pulse" />
                  ) : (
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        battle.outcome?.includes("Ukrainian")
                          ? "bg-capture/70"
                          : battle.outcome?.includes("Russian")
                            ? "bg-destruction/50"
                            : "bg-muted-foreground/30"
                      )}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-[10px] font-medium truncate",
                        isActive ? "text-destruction" : "text-foreground/80"
                      )}
                    >
                      {battle.name}
                    </span>
                    {battle.significance === "critical" && (
                      <TbSkull className="h-2.5 w-2.5 text-destruction/60 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                      <TbCalendar className="h-2.5 w-2.5" />
                      {formatDateRange(battle.startDate, battle.endDate)}
                    </span>
                  </div>

                  {/* Expanded details */}
                  {isSelected && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[9px] text-foreground/60 leading-relaxed">
                        {battle.description}
                      </p>
                      {battle.outcome && (
                        <div className="flex items-center gap-1">
                          <TbMapPin className="h-2.5 w-2.5 text-muted-foreground" />
                          <span
                            className={cn(
                              "text-[9px] font-medium",
                              battle.outcome.includes("Ukrainian")
                                ? "text-capture"
                                : battle.outcome.includes("Russian")
                                  ? "text-destruction/80"
                                  : "text-ua-yellow/80"
                            )}
                          >
                            {battle.outcome}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDateRange(start: string, end?: string): string {
  const fmt = (d: string) => {
    const y = d.slice(0, 4);
    const m = d.slice(4, 6);
    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[parseInt(m)]} ${y}`;
  };
  if (!end) return `${fmt(start)} – Present`;
  return `${fmt(start)} – ${fmt(end)}`;
}
