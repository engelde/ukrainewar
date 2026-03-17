"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { KEY_EVENTS } from "@/data/events";
import {
  TbX,
  TbCalendarEvent,
  TbSword,
  TbShieldCheckered,
  TbBomb,
  TbFlag,
  TbUsers,
  TbBuildingBridge,
  TbArrowBarRight,
} from "react-icons/tb";
import {
  GiExplosiveMaterials,
  GiSubmarine,
} from "react-icons/gi";

interface EventSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEventClick: (date: string) => void;
  currentDate?: string | null;
}

function getEventIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("offensive") || lower.includes("battle") || lower.includes("siege"))
    return <TbSword className="h-4 w-4 text-destruction" />;
  if (lower.includes("falls") || lower.includes("captured") || lower.includes("occupied") || lower.includes("recaptured"))
    return <TbFlag className="h-4 w-4 text-damage" />;
  if (lower.includes("massacre") || lower.includes("strikes") || lower.includes("dam"))
    return <TbBomb className="h-4 w-4 text-destruction" />;
  if (lower.includes("sinks") || lower.includes("moskva"))
    return <GiSubmarine className="h-4 w-4 text-ua-blue-light" />;
  if (lower.includes("bridge"))
    return <GiExplosiveMaterials className="h-4 w-4 text-damage" />;
  if (lower.includes("summit") || lower.includes("election") || lower.includes("inaugurated") || lower.includes("ceasefire"))
    return <TbUsers className="h-4 w-4 text-ua-yellow" />;
  if (lower.includes("sanctions") || lower.includes("pledged") || lower.includes("spider"))
    return <TbShieldCheckered className="h-4 w-4 text-capture" />;
  if (lower.includes("dprk") || lower.includes("deployed"))
    return <TbArrowBarRight className="h-4 w-4 text-abandoned" />;
  if (lower.includes("anniversary") || lower.includes("tracking") || lower.includes("surrender"))
    return <TbCalendarEvent className="h-4 w-4 text-muted-foreground" />;
  if (lower.includes("liberated"))
    return <TbFlag className="h-4 w-4 text-capture" />;
  return <TbCalendarEvent className="h-4 w-4 text-muted-foreground" />;
}

function formatEventDate(dateStr: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const y = dateStr.slice(0, 4);
  const m = parseInt(dateStr.slice(4, 6)) - 1;
  const d = parseInt(dateStr.slice(6, 8));
  return `${months[m]} ${d}, ${y}`;
}

function getWarDay(dateStr: string): number {
  const start = new Date(2022, 1, 24);
  const d = new Date(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(4, 6)) - 1, parseInt(dateStr.slice(6, 8)));
  return Math.floor((d.getTime() - start.getTime()) / 86400000) + 1;
}

// Group events by year
function groupByYear(events: typeof KEY_EVENTS) {
  const groups: Record<string, typeof KEY_EVENTS> = {};
  for (const e of events) {
    const year = e.date.slice(0, 4);
    if (!groups[year]) groups[year] = [];
    groups[year].push(e);
  }
  return groups;
}

export default function EventSidebar({ isOpen, onClose, onEventClick, currentDate }: EventSidebarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to the active event when sidebar opens or currentDate changes
  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isOpen, currentDate]);

  const handleEventClick = useCallback((date: string) => {
    onEventClick(date);
  }, [onEventClick]);

  const yearGroups = groupByYear(KEY_EVENTS);
  const years = Object.keys(yearGroups).sort();

  // Find closest past event for highlighting
  const activeEventDate = (() => {
    if (!currentDate) return null;
    let closest: string | null = null;
    for (const e of KEY_EVENTS) {
      if (e.date <= currentDate) closest = e.date;
    }
    return closest;
  })();

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-80 sm:w-96",
          "bg-background/95 backdrop-blur-xl border-r border-border/40",
          "flex flex-col",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <TbCalendarEvent className="h-5 w-5 text-ua-yellow" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-foreground">
              Key Events
            </h2>
            <span className="text-xs text-muted-foreground">
              ({KEY_EVENTS.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <TbX className="h-4 w-4" />
          </button>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40">
          {years.map((year) => (
            <div key={year}>
              {/* Year header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-2 border-b border-border/20">
                <span className="text-xs font-bold tracking-widest uppercase text-ua-blue-light">
                  {year}
                </span>
              </div>

              {/* Events in year */}
              <div className="px-2 py-1">
                {yearGroups[year].map((event) => {
                  const isActive = event.date === activeEventDate;
                  const isFuture = currentDate ? event.date > currentDate : false;

                  return (
                    <button
                      key={event.date}
                      ref={isActive ? activeRef : undefined}
                      onClick={() => handleEventClick(event.date)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2.5 mb-0.5",
                        "transition-all duration-150",
                        "group",
                        isActive
                          ? "bg-ua-blue/15 border border-ua-blue/30"
                          : "hover:bg-white/5 border border-transparent",
                        isFuture && "opacity-40"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn(
                          "mt-0.5 flex-shrink-0 rounded-md p-1",
                          isActive ? "bg-ua-blue/20" : "bg-white/5"
                        )}>
                          {getEventIcon(event.label)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs font-mono tabular-nums",
                              isActive ? "text-ua-yellow" : "text-muted-foreground"
                            )}>
                              {formatEventDate(event.date)}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                              D{getWarDay(event.date)}
                            </span>
                          </div>
                          <div className={cn(
                            "text-sm font-semibold mt-0.5",
                            isActive ? "text-foreground" : "text-foreground/80"
                          )}>
                            {event.label}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground text-center">
            Click an event to jump to that date on the timeline
          </p>
        </div>
      </div>
    </>
  );
}
