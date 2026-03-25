"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GiExplosiveMaterials, GiSubmarine } from "react-icons/gi";
import {
  TbArrowBarRight,
  TbBomb,
  TbFilter,
  TbFlag,
  TbFlame,
  TbSearch,
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
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

export type EventCategory =
  | "battle"
  | "conflict"
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
    id: "conflict",
    label: "events.categories.conflict",
    icon: <TbFlame className="h-3.5 w-3.5" />,
    color: "text-damage",
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
    icon: <TbFlag className="h-3.5 w-3.5" />,
    color: "text-muted-foreground",
  },
];

export function getEventCategory(label: string): EventCategory {
  const lower = label.toLowerCase();
  if (lower.includes("offensive") || lower.includes("battle") || lower.includes("siege"))
    return "battle";
  // ACLED conflict events (clashes, strikes, shelling, civilian attacks)
  if (
    lower.includes("major clash:") ||
    lower.includes("armed clash:") ||
    lower.includes("air/drone strike:") ||
    lower.includes("shelling/artillery:") ||
    lower.includes("civilian attack:")
  )
    return "conflict";
  if (
    lower.includes("falls") ||
    lower.includes("captured") ||
    lower.includes("occupied") ||
    lower.includes("recaptured") ||
    lower.includes("liberated") ||
    lower.includes("territory transfer:")
  )
    return "territorial";
  if (
    lower.includes("summit") ||
    lower.includes("election") ||
    lower.includes("inaugurated") ||
    lower.includes("ceasefire") ||
    lower.includes("agreement:")
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
  // ACLED conflict events
  if (
    lower.includes("major clash:") ||
    lower.includes("armed clash:") ||
    lower.includes("air/drone strike:") ||
    lower.includes("shelling/artillery:") ||
    lower.includes("civilian attack:")
  )
    return <TbFlame className="h-4 w-4 text-damage" />;
  if (lower.includes("territory transfer:")) return <TbFlag className="h-4 w-4 text-capture" />;
  if (lower.includes("agreement:")) return <TbUsers className="h-4 w-4 text-ua-yellow" />;
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
  return <TbFlag className="h-4 w-4 text-muted-foreground" />;
}

export function formatEventDate(dateStr: string): string {
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  const y = dateStr.slice(0, 4);
  return `${m}.${d}.${y}`;
}

function getWarDay(dateStr: string): number {
  const start = new Date(2022, 1, 24);
  const d = new Date(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(4, 6), 10) - 1,
    parseInt(dateStr.slice(6, 8), 10),
  );
  const diff = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : diff;
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
  onEventClick: (date: string, event?: WarEvent) => void;
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
  const isInitialScrollRef = useRef(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (activeFilters.size > 0) {
      filtered = filtered.filter((e) => activeFilters.has(getEventCategory(e.label)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          formatEventDate(e.date).toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [activeFilters, events, searchQuery]);

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

  // Track which year is currently visible via IntersectionObserver
  const [visibleYear, setVisibleYear] = useState<string>(
    currentDate ? currentDate.slice(0, 4) : years[years.length - 1] || "2022",
  );
  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const year = entry.target.getAttribute("data-year");
            if (year) setVisibleYear(year);
          }
        }
      },
      { root: container, rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    for (const year of years) {
      const el = yearRefs.current[year];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [years]);

  const scrollToYear = useCallback((year: string) => {
    const el = yearRefs.current[year];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setVisibleYear(year);
    }
  }, []);

  const getQuarter = (dateStr: string): string => {
    const month = parseInt(dateStr.slice(4, 6), 10);
    return `Q${Math.ceil(month / 3)}`;
  };

  const quarterGroups = useMemo(() => {
    const groups: Record<string, Record<string, WarEvent[]>> = {};
    for (const [year, evts] of Object.entries(yearGroups)) {
      groups[year] = {};
      for (const e of evts) {
        const q = getQuarter(e.date);
        if (!groups[year][q]) groups[year][q] = [];
        groups[year][q].push(e);
      }
    }
    return groups;
  }, [yearGroups]);

  useEffect(() => {
    if (activeRef.current) {
      // On first render scroll instantly; afterwards animate
      if (isInitialScrollRef.current) {
        activeRef.current.scrollIntoView({ behavior: "instant", block: "end" });
        isInitialScrollRef.current = false;
      } else {
        activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeEventDate]);

  useEffect(() => {
    if (showSearch) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [showSearch]);

  const handleEventClick = useCallback(
    (date: string, event?: WarEvent) => {
      onEventClick(date, event);
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
            <TbFlag className="h-5 w-5 text-ua-yellow" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-sidebar-foreground">
              {t("events.title")}
            </h2>
            <span className="text-xs text-muted-foreground">({filteredEvents.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setShowSearch((p) => !p);
                if (showSearch) setSearchQuery("");
              }}
              aria-label="Search events"
              className={cn(
                "rounded-md p-1.5 transition-colors",
                showSearch
                  ? "text-ua-blue bg-ua-blue/10"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
              title="Search events"
            >
              <TbSearch className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowFilters((p) => !p)}
              aria-label="Filter events by type"
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
                aria-label="Close events sidebar"
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
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider transition-colors",
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
                className="text-[0.625rem] text-muted-foreground hover:text-sidebar-foreground px-1.5 py-0.5 underline"
              >
                {t("common.clear")}
              </button>
            )}
          </div>
        )}
      </SidebarHeader>

      {/* Collapsible search input */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <div className="relative">
            <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("events.searchPlaceholder")}
              aria-label="Search events"
              className="w-full rounded-md bg-sidebar-accent/50 border border-sidebar-border/50 pl-8 pr-8 py-1.5 text-xs text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ua-blue/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-sidebar-foreground"
              >
                <TbX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content area with vertical year nav rail */}
      <div className="flex-1 flex min-h-0">
        {/* Vertical year navigation rail */}
        <div className="flex flex-col items-center py-2 px-1 border-r border-sidebar-border/50 bg-sidebar/50 shrink-0">
          {years.map((year) => {
            const isActiveYear = year === visibleYear;
            const quarters = quarterGroups[year] ? Object.keys(quarterGroups[year]).sort() : [];
            return (
              <div key={year} className="flex flex-col items-center">
                <button
                  onClick={() => scrollToYear(year)}
                  className={cn(
                    "px-1 py-1 rounded text-[0.625rem] font-bold tracking-wider transition-colors writing-mode-vertical",
                    isActiveYear
                      ? "text-ua-blue bg-ua-blue/10"
                      : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-sidebar-accent/50",
                  )}
                  style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}
                >
                  {year}
                </button>
                {isActiveYear && quarters.length > 1 && (
                  <div className="flex flex-col items-center gap-0.5 my-0.5">
                    {quarters.map((q) => {
                      const qEvents = quarterGroups[year]?.[q] ?? [];
                      const qStart = qEvents[0]?.date;
                      const hasActive =
                        activeEventDate && qEvents.some((e) => e.date === activeEventDate);
                      return (
                        <button
                          key={q}
                          onClick={() => {
                            if (qStart) {
                              const el = document.querySelector(`[data-event-date="${qStart}"]`);
                              el?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className={cn(
                            "px-0.5 py-0.5 rounded text-[0.5rem] font-mono transition-colors",
                            hasActive
                              ? "text-ua-blue bg-ua-blue/10"
                              : "text-muted-foreground/40 hover:text-muted-foreground/70",
                          )}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                )}
                {year !== years[years.length - 1] && (
                  <div className="w-px h-2 bg-border/20 my-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable event list */}
        <SidebarContent ref={contentRef} className="scrollbar-styled flex-1">
          {years.map((year) => (
            <SidebarGroup
              key={year}
              ref={(el: HTMLDivElement | null) => {
                yearRefs.current[year] = el;
              }}
              data-year={year}
            >
              <SidebarGroupLabel className="text-xs font-bold tracking-widest uppercase text-ua-blue-light">
                {year}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {yearGroups[year].map((event) => {
                    const isActive = event.date === activeEventDate;
                    const isFuture = currentDate ? event.date > currentDate : false;

                    return (
                      <SidebarMenuItem
                        key={`${event.date}-${event.label}`}
                        data-event-date={event.date}
                      >
                        <SidebarMenuButton
                          ref={isActive ? activeRef : undefined}
                          onClick={() => handleEventClick(event.date, event)}
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
                                <span className="text-[0.625rem] text-muted-foreground/60 font-mono">
                                  D{getWarDay(event.date)}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "text-sm font-semibold mt-0.5 whitespace-normal",
                                  isActive
                                    ? "text-sidebar-foreground"
                                    : "text-sidebar-foreground/80",
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
      </div>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="text-[0.625rem] text-muted-foreground text-center py-1">
          {t("events.footerHint")}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
