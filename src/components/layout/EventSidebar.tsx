"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GiExplosiveMaterials, GiSubmarine } from "react-icons/gi";
import {
  TbArrowBarRight,
  TbBomb,
  TbCalendarEvent,
  TbFilter,
  TbFlag,
  TbShieldCheckered,
  TbSword,
  TbUsers,
  TbX,
} from "react-icons/tb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { WarEvent } from "@/data/events";
import { getMonthsShort, t } from "@/i18n";
import { cn } from "@/lib/utils";

export type EventCategory =
  | "battle"
  | "territorial"
  | "political"
  | "military"
  | "humanitarian"
  | "milestone";

interface EventCategoryInfo {
  id: EventCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const EVENT_CATEGORIES: EventCategoryInfo[] = [
  {
    id: "battle",
    label: "events.categories.battle",
    icon: <TbSword className="h-3.5 w-3.5" />,
    color: "text-destruction",
  },
  {
    id: "territorial",
    label: "events.categories.territorial",
    icon: <TbFlag className="h-3.5 w-3.5" />,
    color: "text-damage",
  },
  {
    id: "political",
    label: "events.categories.political",
    icon: <TbUsers className="h-3.5 w-3.5" />,
    color: "text-ua-yellow",
  },
  {
    id: "military",
    label: "events.categories.military",
    icon: <TbShieldCheckered className="h-3.5 w-3.5" />,
    color: "text-capture",
  },
  {
    id: "humanitarian",
    label: "events.categories.humanitarian",
    icon: <TbBomb className="h-3.5 w-3.5" />,
    color: "text-destruction",
  },
  {
    id: "milestone",
    label: "events.categories.milestone",
    icon: <TbCalendarEvent className="h-3.5 w-3.5" />,
    color: "text-muted-foreground",
  },
];

export function getEventCategory(label: string): EventCategory {
  const lower = label.toLowerCase();
  if (lower.includes("offensive") || lower.includes("battle") || lower.includes("siege"))
    return "battle";
  if (
    lower.includes("falls") ||
    lower.includes("captured") ||
    lower.includes("occupied") ||
    lower.includes("recaptured") ||
    lower.includes("liberated")
  )
    return "territorial";
  if (
    lower.includes("summit") ||
    lower.includes("election") ||
    lower.includes("inaugurated") ||
    lower.includes("ceasefire")
  )
    return "political";
  if (
    lower.includes("massacre") ||
    lower.includes("strikes") ||
    lower.includes("dam") ||
    lower.includes("sinks") ||
    lower.includes("moskva") ||
    lower.includes("bridge")
  )
    return "humanitarian";
  if (
    lower.includes("sanctions") ||
    lower.includes("pledged") ||
    lower.includes("spider") ||
    lower.includes("dprk") ||
    lower.includes("deployed")
  )
    return "military";
  return "milestone";
}

export function getEventIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("offensive") || lower.includes("battle") || lower.includes("siege"))
    return <TbSword className="h-4 w-4 text-destruction" />;
  if (
    lower.includes("falls") ||
    lower.includes("captured") ||
    lower.includes("occupied") ||
    lower.includes("recaptured")
  )
    return <TbFlag className="h-4 w-4 text-damage" />;
  if (lower.includes("massacre") || lower.includes("strikes") || lower.includes("dam"))
    return <TbBomb className="h-4 w-4 text-destruction" />;
  if (lower.includes("sinks") || lower.includes("moskva"))
    return <GiSubmarine className="h-4 w-4 text-ua-blue-light" />;
  if (lower.includes("bridge")) return <GiExplosiveMaterials className="h-4 w-4 text-damage" />;
  if (
    lower.includes("summit") ||
    lower.includes("election") ||
    lower.includes("inaugurated") ||
    lower.includes("ceasefire")
  )
    return <TbUsers className="h-4 w-4 text-ua-yellow" />;
  if (lower.includes("sanctions") || lower.includes("pledged") || lower.includes("spider"))
    return <TbShieldCheckered className="h-4 w-4 text-capture" />;
  if (lower.includes("dprk") || lower.includes("deployed"))
    return <TbArrowBarRight className="h-4 w-4 text-abandoned" />;
  if (lower.includes("liberated")) return <TbFlag className="h-4 w-4 text-capture" />;
  return <TbCalendarEvent className="h-4 w-4 text-muted-foreground" />;
}

export function formatEventDate(dateStr: string): string {
  const months = getMonthsShort();
  const y = dateStr.slice(0, 4);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  return `${months[m]} ${d}, ${y}`;
}

function getWarDay(dateStr: string): number {
  const start = new Date(2022, 1, 24);
  const d = new Date(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(4, 6), 10) - 1,
    parseInt(dateStr.slice(6, 8), 10),
  );
  return Math.floor((d.getTime() - start.getTime()) / 86400000) + 1;
}

function groupByYear(events: WarEvent[]) {
  const groups: Record<string, WarEvent[]> = {};
  for (const e of events) {
    const year = e.date.slice(0, 4);
    if (!groups[year]) groups[year] = [];
    groups[year].push(e);
  }
  return groups;
}

interface EventSidebarProps {
  events: WarEvent[];
  onEventClick: (date: string) => void;
  currentDate?: string | null;
  onClose?: () => void;
}

export default function EventSidebar({
  events,
  onEventClick,
  currentDate,
  onClose,
}: EventSidebarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = useMemo(() => {
    if (activeFilters.size === 0) return events;
    return events.filter((e) => activeFilters.has(getEventCategory(e.label)));
  }, [activeFilters, events]);

  const yearGroups = groupByYear(filteredEvents);
  const years = Object.keys(yearGroups).sort();

  const activeEventDate = useMemo(() => {
    if (!currentDate) return null;
    let closest: string | null = null;
    for (const e of filteredEvents) {
      if (e.date <= currentDate) closest = e.date;
    }
    return closest;
  }, [currentDate, filteredEvents]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeEventDate]);

  const handleEventClick = useCallback(
    (date: string) => {
      onEventClick(date);
    },
    [onEventClick],
  );

  const toggleFilter = useCallback((category: EventCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbCalendarEvent className="h-5 w-5 text-ua-yellow" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-sidebar-foreground">
              {t("events.title")}
            </h2>
            <span className="text-xs text-muted-foreground">({filteredEvents.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                showFilters || activeFilters.size > 0
                  ? "text-ua-yellow bg-ua-yellow/10"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
              title={t("events.filterByType")}
            >
              <TbFilter className="h-4 w-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title={t("events.closeSidebar")}
              >
                <TbX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {/* Category filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-1 mt-2">
            {EVENT_CATEGORIES.map((cat) => {
              const isActive = activeFilters.has(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleFilter(cat.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    isActive
                      ? `bg-sidebar-accent ${cat.color} ring-1 ring-current/30`
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  {cat.icon}
                  {t(cat.label)}
                </button>
              );
            })}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="text-[10px] text-muted-foreground hover:text-sidebar-foreground px-1.5 py-0.5 underline"
              >
                {t("common.clear")}
              </button>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {years.map((year) => (
          <SidebarGroup key={year}>
            <SidebarGroupLabel className="text-xs font-bold tracking-widest uppercase text-ua-blue-light">
              {year}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {yearGroups[year].map((event) => {
                  const isActive = event.date === activeEventDate;
                  const isFuture = currentDate ? event.date > currentDate : false;

                  return (
                    <SidebarMenuItem key={`${event.date}-${event.label}`}>
                      <SidebarMenuButton
                        ref={isActive ? activeRef : undefined}
                        onClick={() => handleEventClick(event.date)}
                        isActive={isActive}
                        className={cn("h-auto py-2 px-2", isFuture && "opacity-40")}
                      >
                        <div className="flex items-start gap-2.5 w-full">
                          <div
                            className={cn(
                              "mt-0.5 flex-shrink-0 rounded-md p-1",
                              isActive ? "bg-sidebar-primary/20" : "bg-sidebar-accent",
                            )}
                          >
                            {getEventIcon(event.label)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs font-mono tabular-nums",
                                  isActive ? "text-ua-yellow" : "text-muted-foreground",
                                )}
                              >
                                {formatEventDate(event.date)}
                              </span>
                              <span className="text-[10px] text-muted-foreground/60 font-mono">
                                D{getWarDay(event.date)}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "text-sm font-semibold mt-0.5 whitespace-normal",
                                isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/80",
                              )}
                            >
                              {event.label}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed whitespace-normal">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground text-center py-1">
          {t("events.footerHint")}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
