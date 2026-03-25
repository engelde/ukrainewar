"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WarEvent } from "@/data/events";
import { cn } from "@/lib/utils";
import {
  formatDateShort,
  generateDateRange,
  PIXELS_PER_DAY,
  SPEED_OPTIONS,
  YEAR_MARKS,
} from "./timeline-constants";
import { TimelineControls } from "./timeline-controls";
import { TimelineEventCard } from "./timeline-event-card";
import { TimelineWaveformCanvas } from "./timeline-waveform-canvas";

interface TimelineScrubberProps {
  events: WarEvent[];
  onDateChange: (date: string) => void;
  initialDate?: string | null;
  externalDate?: string | null;
  dockSlot?: React.ReactNode;
  eventsOpen?: boolean;
  onToggleEvents?: () => void;
}

export default function TimelineScrubber({
  events,
  onDateChange,
  initialDate,
  externalDate,
  dockSlot,
  eventsOpen,
  onToggleEvents,
}: TimelineScrubberProps) {
  const [dates] = useState<string[]>(() => generateDateRange());
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialDate) {
      const allDates = generateDateRange();
      const idx = allDates.findIndex((d) => d >= initialDate);
      if (idx >= 0) return idx;
    }
    return generateDateRange().length - 1;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2); // default 1× (400ms)
  const [showPlayHint, setShowPlayHint] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dismissedEventDate, setDismissedEventDate] = useState<string | null>(null);

  // Check if play hint should be hidden (after hydration)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("played")) {
      setShowPlayHint(false);
    }
  }, []);

  // Daily losses waveform data
  const [dailyLosses, setDailyLosses] = useState<Map<string, number>>(new Map());
  const [maxDaily, setMaxDaily] = useState(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialScroll = useRef(true);

  // Drag-to-scroll state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // Throttle data-heavy onDateChange during playback
  const dateChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDateRef = useRef<string | null>(null);

  // Fetch daily losses for waveform visualization
  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const r = await fetch("/api/casualties/daily-totals", { signal: controller.signal });
        const data: { date: string; total: number }[] | null = r.ok ? await r.json() : null;
        if (!data || !Array.isArray(data)) return;
        const map = new Map<string, number>();
        const sorted = [...data.map((d) => d.total)].sort((a, b) => a - b);
        const p99 = sorted[Math.floor(sorted.length * 0.99)] || 1;
        let max = 0;
        for (const entry of data) {
          const capped = Math.min(entry.total, p99);
          map.set(entry.date, capped);
          if (capped > max) max = capped;
        }
        setDailyLosses(map);
        setMaxDaily(max);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError")
          console.error("Daily totals fetch error:", e);
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  // Notify parent when index changes (throttled during playback)
  useEffect(() => {
    if (currentIndex < 0 || !dates[currentIndex]) return;
    const date = dates[currentIndex];

    if (!isPlaying) {
      // Not playing — update immediately (manual scrub / step)
      if (dateChangeTimerRef.current) {
        clearTimeout(dateChangeTimerRef.current);
        dateChangeTimerRef.current = null;
      }
      pendingDateRef.current = null;
      onDateChange(date);
      return;
    }

    // During playback — throttle to max ~8 updates/sec
    pendingDateRef.current = date;
    if (!dateChangeTimerRef.current) {
      onDateChange(date); // Fire immediately on first tick
      dateChangeTimerRef.current = setTimeout(() => {
        dateChangeTimerRef.current = null;
        if (pendingDateRef.current) {
          onDateChange(pendingDateRef.current);
        }
      }, 120);
    }
  }, [currentIndex, dates, onDateChange, isPlaying]);

  // Flush pending date when playback stops
  useEffect(() => {
    if (!isPlaying && pendingDateRef.current) {
      onDateChange(pendingDateRef.current);
      pendingDateRef.current = null;
    }
    return () => {
      if (dateChangeTimerRef.current) {
        clearTimeout(dateChangeTimerRef.current);
        dateChangeTimerRef.current = null;
      }
    };
  }, [isPlaying, onDateChange]);

  // Play/pause — if at the end, restart from beginning
  const togglePlay = useCallback(() => {
    if (showPlayHint) {
      setShowPlayHint(false);
      // Persist that the user has played at least once
      const url = new URL(window.location.href);
      url.searchParams.set("played", "1");
      window.history.replaceState({}, "", url.toString());
    }
    setIsPlaying((prev) => {
      if (!prev) {
        // Starting playback
        setCurrentIndex((idx) => {
          if (idx >= dates.length - 1) return 0; // at end → restart
          return idx;
        });
        return true;
      }
      return false;
    });
  }, [dates.length, showPlayHint]);

  // Jump to start
  const jumpToStart = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  // Jump to end (today)
  const jumpToEnd = useCallback(() => {
    setCurrentIndex(dates.length - 1);
    setIsPlaying(false);
  }, [dates.length]);

  // Hold-to-advance refs
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdFiredRef = useRef(false);

  const handleStepBackDown = useCallback(() => {
    holdFiredRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      holdFiredRef.current = true;
      const currentDateStr = dates[currentIndex] || "";
      const prevEvent = [...events].reverse().find((e) => e.date < currentDateStr);
      if (prevEvent) {
        const idx = dates.findIndex((d) => d >= prevEvent.date);
        if (idx >= 0) {
          setCurrentIndex(idx);
          setIsPlaying(false);
        }
      } else {
        setCurrentIndex(0);
        setIsPlaying(false);
      }
    }, 500);
  }, [dates, currentIndex, events]);

  const handleStepForwardDown = useCallback(() => {
    holdFiredRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      holdFiredRef.current = true;
      const currentDateStr = dates[currentIndex] || "";
      const nextEvent = events.find((e) => e.date > currentDateStr);
      if (nextEvent) {
        const idx = dates.findIndex((d) => d >= nextEvent.date);
        if (idx >= 0) {
          setCurrentIndex(idx);
          setIsPlaying(false);
        }
      } else {
        setCurrentIndex(dates.length - 1);
        setIsPlaying(false);
      }
    }, 500);
  }, [dates, currentIndex, events]);

  const handleStepUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying && dates.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= dates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, SPEED_OPTIONS[speedIndex].ms);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, dates.length, speedIndex]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging.current) return;
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + container.scrollLeft;
      const idx = Math.round(x / PIXELS_PER_DAY);
      setCurrentIndex(Math.max(0, Math.min(dates.length - 1, idx)));
      setIsPlaying(false);
    },
    [dates.length],
  );

  // Drag-to-scroll handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    isDragging.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = container.scrollLeft;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartX.current;
      if (Math.abs(dx) > 3) isDragging.current = true;
      container.scrollLeft = dragScrollLeft.current - dx;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Reset drag flag after click event fires
      requestAnimationFrame(() => {
        isDragging.current = false;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollLeft += e.deltaY;
    }
  }, []);

  const handleJumpToEvent = useCallback(
    (eventDate: string) => {
      const idx = dates.findIndex((d) => d >= eventDate);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setIsPlaying(false);
      }
    },
    [dates],
  );

  const handleJumpToYear = useCallback(
    (year: string) => {
      const targetDate = year === "2022" ? "20220224" : `${year}0101`;
      const idx = dates.findIndex((d) => d >= targetDate);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setIsPlaying(false);
      }
    },
    [dates],
  );

  const handleStepBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    setCurrentIndex((prev) => Math.min(dates.length - 1, prev + 1));
    setIsPlaying(false);
  }, [dates.length]);

  const handleStepBackClick = useCallback(() => {
    if (!holdFiredRef.current) handleStepBack();
  }, [handleStepBack]);

  const handleStepForwardClick = useCallback(() => {
    if (!holdFiredRef.current) handleStepForward();
  }, [handleStepForward]);

  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const dateStr = `${y}${m}${d}`;
      const idx = dates.findIndex((dd) => dd >= dateStr);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setIsPlaying(false);
      }
      setCalendarOpen(false);
    },
    [dates],
  );

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((prev) => (prev + 1) % SPEED_OPTIONS.length);
  }, []);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const pos = currentIndex * PIXELS_PER_DAY;
    const viewWidth = container.clientWidth;

    if (isInitialScroll.current) {
      container.scrollLeft = pos - viewWidth * 0.7;
      isInitialScroll.current = false;
      return;
    }

    const scrollLeft = container.scrollLeft;
    const padding = 80;
    if (pos < scrollLeft + padding || pos > scrollLeft + viewWidth - padding) {
      if (isPlaying) {
        container.scrollLeft = pos - viewWidth / 3;
      } else {
        container.scrollTo({
          left: pos - viewWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [currentIndex, isPlaying]);

  // Sync currentIndex when external date changes (e.g., event sidebar click)
  const lastExternalDate = useRef<string | null | undefined>(externalDate);
  useEffect(() => {
    if (externalDate && externalDate !== lastExternalDate.current && !isPlaying) {
      const idx = dates.findIndex((d) => d >= externalDate);
      if (idx >= 0 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
    lastExternalDate.current = externalDate;
  }, [externalDate, dates, isPlaying, currentIndex]);

  // Clear dismissed event when nearest event changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: clear dismissal when a new event comes in range
  useEffect(() => {
    if (!dismissedEventDate || dates.length === 0) return;
    // Recompute which event is nearest (within 5 days)
    const nearest = events.find((event) => {
      const idx = dates.findIndex((d) => d >= event.date);
      return idx >= 0 && Math.abs(currentIndex - idx) <= 5;
    });
    if (nearest && nearest.date !== dismissedEventDate) {
      setDismissedEventDate(null);
    }
  }, [currentIndex, dates, events, dismissedEventDate]);

  // O(1) date-to-index lookup map (pre-computed from dates array)
  const dateToIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < dates.length; i++) {
      map.set(dates[i], i);
    }
    return map;
  }, [dates]);

  // Event positions in pixels (memoized with O(1) lookups via dateToIndex)
  const eventPositionsPx = useMemo(() => {
    return events
      .map((event) => {
        let idx = dateToIndex.get(event.date);
        if (idx === undefined) {
          // Fallback: find first date >= event.date for dates between entries
          idx = dates.findIndex((d) => d >= event.date);
        }
        if (idx === undefined || idx < 0) return null;
        return { ...event, px: idx * PIXELS_PER_DAY, index: idx };
      })
      .filter(Boolean) as (WarEvent & { px: number; index: number })[];
  }, [events, dates, dateToIndex]);

  if (dates.length === 0) return null;

  const currentDate = dates[currentIndex] || dates[dates.length - 1];
  const totalWidth = dates.length * PIXELS_PER_DAY;

  // Closest active highlighted event (within 5 days), dismissible by user
  const nearestEvent = eventPositionsPx.find((event) => {
    return event.highlight && Math.abs(currentIndex - event.index) <= 5;
  });
  const activeEvent =
    nearestEvent && nearestEvent.date !== dismissedEventDate ? nearestEvent : null;

  // Year boundaries in pixels
  const yearTicksPx = YEAR_MARKS.map((y) => {
    if (y === "2022") return { year: y, px: 0 };
    const idx = dates.indexOf(`${y}0101`);
    return idx >= 0 ? { year: y, px: idx * PIXELS_PER_DAY } : null;
  }).filter(Boolean) as { year: string; px: number }[];

  // Which years are available for jump buttons
  const availableYears = YEAR_MARKS.filter((y) => {
    if (y === "2022") return true;
    return dates.indexOf(`${y}0101`) >= 0;
  });

  // Current year from the timeline
  const currentYear = currentDate.slice(0, 4);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        "px-4 pb-1.5 sm:px-6 sm:pb-2",
        "flex flex-col items-start pointer-events-none",
      )}
    >
      {/* Minimized panels dock */}
      {dockSlot && (
        <div className="flex flex-wrap items-end gap-1.5 px-4 pb-1.5 pointer-events-auto">
          {dockSlot}
        </div>
      )}

      {/* Timeline panel — always expanded */}
      <div
        className={cn(
          "w-full rounded-lg pointer-events-auto",
          "bg-background/90 backdrop-blur-xl",
          "border border-border/50",
          "shadow-[0_-4px_20px_rgba(0,0,0,0.4)]",
          "transition-all duration-300",
        )}
      >
        {/* Event info card — shown when near key events */}
        {activeEvent && (
          <TimelineEventCard
            label={activeEvent.label}
            date={activeEvent.date}
            description={activeEvent.description}
            onDismiss={() => setDismissedEventDate(activeEvent.date)}
          />
        )}

        {/* Controls row */}
        <TimelineControls
          currentDate={currentDate}
          currentIndex={currentIndex}
          datesLength={dates.length}
          isPlaying={isPlaying}
          speedLabel={SPEED_OPTIONS[speedIndex].label}
          calendarOpen={calendarOpen}
          onCalendarOpenChange={setCalendarOpen}
          onCalendarSelect={handleCalendarSelect}
          currentYear={currentYear}
          availableYears={availableYears}
          showPlayHint={showPlayHint}
          eventsOpen={eventsOpen}
          onTogglePlay={togglePlay}
          onJumpToStart={jumpToStart}
          onJumpToEnd={jumpToEnd}
          onStepBackClick={handleStepBackClick}
          onStepForwardClick={handleStepForwardClick}
          onStepBackDown={handleStepBackDown}
          onStepForwardDown={handleStepForwardDown}
          onStepUp={handleStepUp}
          onCycleSpeed={cycleSpeed}
          onJumpToYear={handleJumpToYear}
          onToggleEvents={onToggleEvents}
        />

        {/* Scrollable timeline */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-none mx-4 mt-1 select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
        >
          <div
            className="relative cursor-crosshair"
            style={{ width: `${totalWidth}px`, height: "40px" }}
            onClick={handleTimelineClick}
          >
            {/* Daily losses waveform (background) */}
            {maxDaily > 0 && (
              <TimelineWaveformCanvas
                dates={dates}
                dailyLosses={dailyLosses}
                maxDaily={maxDaily}
                totalWidth={totalWidth}
                currentIndex={currentIndex}
              />
            )}

            {/* Track line */}
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-border/30 rounded-full" />

            {/* Year tick marks + labels */}
            {yearTicksPx.map((tick) => (
              <div key={tick.year} className="absolute top-0" style={{ left: `${tick.px}px` }}>
                <div className="w-px h-6 bg-border/40" />
                <span className="absolute top-7 -translate-x-1/2 text-[0.5625rem] text-muted-foreground/50 whitespace-nowrap">
                  {tick.year}
                </span>
              </div>
            ))}

            {/* Event marker dots */}
            {eventPositionsPx.map((event, i) => (
              <Tooltip key={`${event.date}-${i}`}>
                <TooltipTrigger
                  render={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToEvent(event.date);
                      }}
                      className={cn(
                        "absolute top-1.5 -translate-x-1/2 rounded-full transition-all z-10",
                        activeEvent?.date === event.date
                          ? "w-2 h-3 bg-ua-yellow"
                          : "w-1.5 h-2.5 bg-ua-yellow/50 hover:bg-ua-yellow hover:h-3",
                      )}
                      style={{ left: `${event.px}px` }}
                    />
                  }
                />
                <TooltipContent
                  side="top"
                  className="flex-col items-start max-w-[280px] bg-background/95 backdrop-blur-lg border border-border/60 text-foreground px-3 py-2"
                >
                  <p className="text-[0.6875rem] font-semibold text-ua-yellow mb-0.5">
                    {event.label}
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground leading-snug">
                    {event.description}
                  </p>
                  <p className="text-[0.5625rem] text-muted-foreground/60 mt-1">
                    {formatDateShort(event.date)}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Playhead (current date indicator) */}
            <div
              className="absolute top-0 w-0.5 bg-ua-blue rounded-full pointer-events-none z-20"
              style={{
                left: `${currentIndex * PIXELS_PER_DAY}px`,
                height: "24px",
              }}
            />
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: `${currentIndex * PIXELS_PER_DAY}px`,
                top: "24px",
              }}
            >
              <div className="w-1.5 h-1.5 bg-ua-blue rounded-full -translate-x-[2.5px]" />
            </div>
          </div>
        </div>

        {/* Year / month progress tracker — clickable to jump */}
        <div className="mx-4 mb-1.5 mt-0 flex items-end h-4">
          {YEAR_MARKS.map((year) => {
            const yearStartIdx = year === "2022" ? 0 : dates.indexOf(`${year}0101`);
            if (yearStartIdx < 0) return null;
            const nextYear = String(Number(year) + 1);
            const nextYearIdx = dates.indexOf(`${nextYear}0101`);
            const yearEndIdx = nextYearIdx >= 0 ? nextYearIdx : dates.length;
            const yearDays = yearEndIdx - yearStartIdx;
            if (yearDays <= 0) return null;
            const widthPct = (yearDays / dates.length) * 100;
            const isCurrentYear = currentDate.slice(0, 4) === year;
            const isPastYear = currentDate.slice(0, 4) > year;
            const fillPct = isCurrentYear
              ? Math.min(100, ((currentIndex - yearStartIdx) / yearDays) * 100)
              : isPastYear
                ? 100
                : 0;

            const handleTrackerClick = (e: React.MouseEvent<HTMLDivElement>) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const targetIdx = Math.round(yearStartIdx + clickPct * yearDays);
              const clampedIdx = Math.max(0, Math.min(dates.length - 1, targetIdx));
              setCurrentIndex(clampedIdx);
              onDateChange(dates[clampedIdx]);
            };

            return (
              <div
                key={year}
                className="relative h-full flex flex-col justify-end cursor-pointer group"
                style={{ width: `${widthPct}%` }}
                onClick={handleTrackerClick}
              >
                <span
                  className={cn(
                    "text-[0.5rem] font-mono tracking-wider leading-none mb-0.5 pl-0.5",
                    isCurrentYear
                      ? "text-ua-blue"
                      : "text-muted-foreground/40 group-hover:text-muted-foreground/60",
                  )}
                >
                  {year}
                  {isCurrentYear && (
                    <span className="ml-1 text-muted-foreground/60">
                      {currentDate.slice(4, 6)}/{currentDate.slice(6, 8)}
                    </span>
                  )}
                </span>
                <div
                  className={cn(
                    "w-full h-1 rounded-full overflow-hidden transition-all",
                    isCurrentYear ? "bg-ua-blue/15" : "bg-border/15 group-hover:bg-border/25",
                  )}
                >
                  <div
                    className="h-full bg-ua-blue/40 rounded-full transition-all duration-300"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
