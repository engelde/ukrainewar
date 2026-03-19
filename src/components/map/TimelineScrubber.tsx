"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  TbChevronLeft,
  TbChevronRight,
  TbInfoCircle,
  TbPlayerPauseFilled,
  TbPlayerPlayFilled,
  TbPlayerSkipBackFilled,
  TbPlayerSkipForwardFilled,
  TbTimeline,
} from "react-icons/tb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WarEvent } from "@/data/events";
import { getMonthsShort, t } from "@/i18n";
import { cn } from "@/lib/utils";

interface TimelineScrubberProps {
  events: WarEvent[];
  onDateChange: (date: string) => void;
  initialDate?: string | null;
  dockSlot?: React.ReactNode;
  eventsOpen?: boolean;
  onToggleEvents?: () => void;
}

const SPEED_OPTIONS = [
  { label: "0.25×", ms: 800 },
  { label: "0.5×", ms: 400 },
  { label: "1×", ms: 200 },
  { label: "2×", ms: 100 },
  { label: "4×", ms: 50 },
];

function formatDateDisplay(dateStr: string): string {
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  const y = dateStr.slice(0, 4);
  return `${m}.${d}.${y}`;
}

function formatDateShort(dateStr: string): string {
  const months = getMonthsShort();
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = dateStr.slice(6, 8);
  return `${months[m]} ${parseInt(d, 10)}`;
}

function generateDateRange(): string[] {
  const dates: string[] = [];
  const start = new Date("2022-02-24");
  const end = new Date();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}${m}${day}`);
  }
  return dates;
}

const PIXELS_PER_DAY = 2;

const YEAR_MARKS = ["2022", "2023", "2024", "2025", "2026"];

export default function TimelineScrubber({
  events,
  onDateChange,
  initialDate,
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
  const [speedIndex, setSpeedIndex] = useState(2); // default 1× (200ms)

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
  }, [dates.length]);

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

  if (dates.length === 0) return null;

  const currentDate = dates[currentIndex] || dates[dates.length - 1];
  const totalWidth = dates.length * PIXELS_PER_DAY;

  // Event positions in pixels
  const eventPositionsPx = events
    .map((event) => {
      const idx = dates.findIndex((d) => d >= event.date);
      return {
        ...event,
        px: idx >= 0 ? idx * PIXELS_PER_DAY : -1,
        index: idx,
      };
    })
    .filter((e) => e.px >= 0);

  // All labels with two-row collision-free layout
  const labelRows = (() => {
    const MIN_LABEL_GAP = 55;
    const rows: { date: string; label: string; description: string; px: number; row: number }[] =
      [];
    let lastRow0 = -MIN_LABEL_GAP;
    let lastRow1 = -MIN_LABEL_GAP;

    for (const event of eventPositionsPx) {
      if (event.px - lastRow0 >= MIN_LABEL_GAP) {
        rows.push({
          date: event.date,
          label: event.label,
          description: event.description,
          px: event.px,
          row: 0,
        });
        lastRow0 = event.px;
      } else if (event.px - lastRow1 >= MIN_LABEL_GAP) {
        rows.push({
          date: event.date,
          label: event.label,
          description: event.description,
          px: event.px,
          row: 1,
        });
        lastRow1 = event.px;
      }
    }
    return rows;
  })();

  // Closest active event (within 5 days)
  const activeEvent = eventPositionsPx.find((event) => {
    return Math.abs(currentIndex - event.index) <= 5;
  });

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
      {/* Collapsed panels dock slot */}
      {dockSlot && (
        <div className="flex flex-col gap-1.5 mb-1.5 pointer-events-auto">{dockSlot}</div>
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
          <div className="mx-3 mt-2.5 rounded-md bg-ua-blue/10 border border-ua-blue/20 px-4 py-2.5 flex items-start gap-2.5">
            <TbInfoCircle className="h-4 w-4 text-ua-blue mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-ua-blue">{activeEvent.label}</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {formatDateShort(activeEvent.date)}
                </span>
              </div>
              <p className="text-[12px] text-foreground/80 mt-1 leading-relaxed">
                {activeEvent.description}
              </p>
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center gap-2.5 px-4 pt-3 sm:gap-3">
          {/* Date info */}
          <div className="flex flex-col items-start gap-0 min-w-[100px] sm:min-w-[130px]">
            <div className="flex items-center gap-2">
              <TbTimeline className="h-3.5 w-3.5 text-ua-blue" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ua-blue">
                {t("timeline.title")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-mono text-foreground font-medium">
                {formatDateDisplay(currentDate)}
              </span>
              {currentIndex === dates.length - 1 && (
                <span className="text-[9px] text-capture font-mono">{t("common.today")}</span>
              )}
            </div>
          </div>

          {/* Transport controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={jumpToStart}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
              title={t("timeline.jumpToStart")}
            >
              <TbPlayerSkipBackFilled className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => {
                if (!holdFiredRef.current) handleStepBack();
              }}
              onMouseDown={handleStepBackDown}
              onMouseUp={handleStepUp}
              onMouseLeave={handleStepUp}
              disabled={currentIndex <= 0}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <TbChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                isPlaying
                  ? "bg-ua-blue/20 text-ua-blue"
                  : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground",
              )}
            >
              {isPlaying ? (
                <TbPlayerPauseFilled className="h-5 w-5" />
              ) : (
                <TbPlayerPlayFilled className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => {
                if (!holdFiredRef.current) handleStepForward();
              }}
              onMouseDown={handleStepForwardDown}
              onMouseUp={handleStepUp}
              onMouseLeave={handleStepUp}
              disabled={currentIndex >= dates.length - 1}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <TbChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={jumpToEnd}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
              title={t("timeline.jumpToToday")}
            >
              <TbPlayerSkipForwardFilled className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Speed control */}
          <button
            onClick={cycleSpeed}
            className={cn(
              "flex h-9 items-center justify-center rounded-md px-2.5 transition-colors",
              "text-xs font-mono font-semibold",
              isPlaying
                ? "bg-ua-blue/15 text-ua-blue"
                : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground",
            )}
            title={t("timeline.playbackSpeed")}
          >
            {SPEED_OPTIONS[speedIndex].label}
          </button>

          {/* Year jump buttons — desktop only */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => handleJumpToYear(y)}
                className={cn(
                  "flex h-6 items-center justify-center rounded px-1.5 transition-colors",
                  "text-[9px] font-mono",
                  currentYear === y
                    ? "bg-ua-blue/15 text-ua-blue font-semibold"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-surface-elevated/50",
                )}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Spacer to push Events button to right */}
          <div className="flex-1" />

          {/* Events toggle — far right */}
          {onToggleEvents && (
            <button
              onClick={onToggleEvents}
              title={t("timeline.toggleEvents")}
              className={cn(
                "flex h-7 items-center rounded-md px-2.5 transition-colors",
                "text-[10px] font-semibold uppercase tracking-wider",
                eventsOpen
                  ? "bg-ua-yellow/15 text-ua-yellow"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
              )}
            >
              {t("timeline.events")}
            </button>
          )}
        </div>

        {/* Scrollable timeline */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-none mx-4 mb-3 mt-2 select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
        >
          <div
            className="relative cursor-crosshair"
            style={{ width: `${totalWidth}px`, height: "75px" }}
            onClick={handleTimelineClick}
          >
            {/* Daily losses waveform (background) */}
            {maxDaily > 0 && (
              <WaveformCanvas
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
                <span className="absolute top-7 -translate-x-1/2 text-[9px] text-muted-foreground/50 whitespace-nowrap">
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
                  className="max-w-[280px] bg-background/95 backdrop-blur-lg border border-border/60 text-foreground px-3 py-2"
                >
                  <p className="text-[11px] font-semibold text-ua-yellow mb-0.5">{event.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    {event.description}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">
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

            {/* Event labels below timeline */}
            <div className="absolute left-0 right-0 pointer-events-none" style={{ top: "28px" }}>
              {labelRows.map((labelInfo, i) => {
                const isLabelActive = activeEvent?.date === labelInfo.date;
                return (
                  <Tooltip key={`${labelInfo.date}-${i}`}>
                    <TooltipTrigger
                      render={
                        <div
                          className="absolute pointer-events-auto cursor-pointer"
                          style={{ left: `${labelInfo.px}px` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJumpToEvent(labelInfo.date);
                          }}
                        />
                      }
                    >
                      <div className="flex flex-col items-center -translate-x-1/2">
                        <div
                          className={cn(
                            "w-px",
                            labelInfo.row === 0 ? "h-2" : "h-5",
                            isLabelActive ? "bg-ua-yellow/50" : "bg-border/40",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[12px] whitespace-nowrap leading-none mt-0.5",
                            "transition-colors",
                            isLabelActive
                              ? "text-ua-yellow font-semibold"
                              : "text-muted-foreground/70 hover:text-muted-foreground",
                          )}
                        >
                          {labelInfo.date.slice(4, 6)}.{labelInfo.date.slice(6, 8)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-[280px] bg-background/95 backdrop-blur-lg border border-border/60 text-foreground px-3 py-2"
                    >
                      <p className="text-[11px] font-semibold text-ua-yellow mb-0.5">
                        {labelInfo.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {labelInfo.description}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 mt-1">
                        {formatDateShort(labelInfo.date)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Canvas-based waveform for daily losses visualization

const WaveformCanvas = memo(function WaveformCanvas({
  dates,
  dailyLosses,
  maxDaily,
  totalWidth,
  currentIndex,
}: {
  dates: string[];
  dailyLosses: Map<string, number>;
  maxDaily: number;
  totalWidth: number;
  currentIndex: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const WAVE_HEIGHT = 22;
  const WAVE_TOP = 3; // align with track line center

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = WAVE_HEIGHT * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, WAVE_HEIGHT);

    const barWidth = PIXELS_PER_DAY;
    const mid = WAVE_HEIGHT / 2;

    for (let i = 0; i < dates.length; i++) {
      const val = dailyLosses.get(dates[i]) ?? 0;
      if (val === 0) continue;

      const ratio = val / maxDaily;
      const halfH = ratio * (WAVE_HEIGHT / 2 - 1);

      const isPast = i <= currentIndex;
      if (isPast) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
      } else {
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
      }

      const x = i * barWidth;
      ctx.fillRect(x, mid - halfH, Math.max(barWidth - 0.5, 1), halfH * 2);
    }
  }, [dates, dailyLosses, maxDaily, totalWidth, currentIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-0 pointer-events-none"
      style={{
        top: `${WAVE_TOP}px`,
        width: `${totalWidth}px`,
        height: `${WAVE_HEIGHT}px`,
      }}
    />
  );
});
