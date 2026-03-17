"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  TbPlayerPlayFilled,
  TbPlayerPauseFilled,
  TbChevronLeft,
  TbChevronRight,
  TbChevronDown,
  TbInfoCircle,
  TbPlayerSkipBackFilled,
} from "react-icons/tb";

interface TimelineScrubberProps {
  onDateChange: (date: string) => void;
  initialDate?: string | null;
}

// Key events in the war for timeline markers
const KEY_EVENTS: { date: string; label: string; description: string }[] = [
  // 2022
  { date: "20220224", label: "Invasion begins", description: "Russia launches full-scale invasion of Ukraine from multiple directions" },
  { date: "20220227", label: "Sanctions & SWIFT", description: "Western nations impose sweeping sanctions; select Russian banks cut from SWIFT" },
  { date: "20220302", label: "Kherson falls", description: "Russia captures Kherson, the first major Ukrainian city to fall" },
  { date: "20220316", label: "Mariupol siege", description: "Russian forces encircle Mariupol; intense urban combat begins" },
  { date: "20220402", label: "Bucha massacre", description: "Ukrainian forces recapture Bucha; evidence of mass civilian killings discovered" },
  { date: "20220414", label: "Moskva sinks", description: "Ukrainian Neptune missiles sink the Russian Black Sea flagship Moskva" },
  { date: "20220520", label: "Azovstal surrender", description: "Last Ukrainian defenders of Mariupol's Azovstal steel plant surrender" },
  { date: "20220624", label: "Lysychansk falls", description: "Russia captures Lysychansk, completing control of Luhansk Oblast" },
  { date: "20220906", label: "Kharkiv offensive", description: "Ukraine launches rapid counteroffensive, liberating most of Kharkiv Oblast in days" },
  { date: "20221008", label: "Crimea Bridge hit", description: "Explosion damages the Kerch Strait Bridge connecting Crimea to Russia" },
  { date: "20221111", label: "Kherson liberated", description: "Russia withdraws from Kherson; Ukraine's most significant territorial gain" },
  // 2023
  { date: "20230121", label: "Tanks pledged", description: "Western allies pledge Leopard 2 and M1 Abrams tanks to Ukraine" },
  { date: "20230521", label: "Bakhmut falls", description: "Wagner forces capture Bakhmut after the war's longest and bloodiest battle" },
  { date: "20230608", label: "Kakhovka Dam", description: "Kakhovka Dam is destroyed, causing catastrophic flooding downstream" },
  { date: "20230610", label: "Summer offensive", description: "Ukraine begins long-anticipated counteroffensive in southern Zaporizhzhia" },
  { date: "20230823", label: "Prigozhin killed", description: "Wagner leader Yevgeny Prigozhin dies in plane crash two months after aborted mutiny" },
  // 2024
  { date: "20240217", label: "Avdiivka falls", description: "Russia captures Avdiivka after months of intense fighting" },
  { date: "20240708", label: "Territory data begins", description: "DeepState territory tracking data starts" },
  { date: "20240718", label: "Pokrovsk offensive", description: "Russia launches major offensive toward Pokrovsk in Donetsk Oblast with ~40,000 troops" },
  { date: "20240806", label: "Kursk offensive", description: "Ukraine launches surprise cross-border offensive into Russia's Kursk Oblast" },
  { date: "20240826", label: "Massive energy strikes", description: "Russia launches one of its largest combined missile and drone attacks targeting Ukrainian energy infrastructure" },
  { date: "20240901", label: "Novohrodivka falls", description: "Russian forces capture Novohrodivka in their advance toward Pokrovsk" },
  { date: "20241005", label: "Vuhledar falls", description: "Russia captures Vuhledar after prolonged siege" },
  { date: "20241016", label: "Kurakhove battle begins", description: "Russian forces begin assault on the city of Kurakhove in Donetsk Oblast" },
  { date: "20241105", label: "US election", description: "Donald Trump wins US presidential election, casting uncertainty over Ukraine support" },
  { date: "20241115", label: "Selydove falls", description: "Russian forces capture the city of Selydove in Donetsk Oblast" },
  { date: "20241216", label: "DPRK troops deployed", description: "North Korean soldiers confirmed fighting alongside Russian forces in Kursk" },
  { date: "20241225", label: "Kurakhove falls", description: "Russia captures Kurakhove after 2-month battle, seizes power station" },
  // 2025
  { date: "20250120", label: "Trump inaugurated", description: "Trump takes office, signals prioritization of ending the war" },
  { date: "20250224", label: "3rd anniversary", description: "Three years since Russia's full-scale invasion of Ukraine" },
  { date: "20250318", label: "Ceasefire proposed", description: "Trump-Putin call results in proposed limited ceasefire on energy infrastructure; quickly broken" },
  { date: "20250426", label: "Kursk recaptured", description: "Russia claims all Ukrainian forces driven out of Kursk region" },
  { date: "20250601", label: "Operation Spider Web", description: "Ukraine launches coordinated long-range drone strikes on Russian airfields deep in Russian territory" },
  { date: "20250630", label: "Luhansk fully occupied", description: "Russia claims complete control of Luhansk Oblast" },
  { date: "20250731", label: "Chasiv Yar falls", description: "Russia captures the strategic fortress city of Chasiv Yar after prolonged assault" },
  { date: "20250815", label: "Alaska summit", description: "Trump and Putin meet at Joint Base Elmendorf-Richardson in Anchorage; no ceasefire achieved" },
  { date: "20250818", label: "DC summit", description: "Trump hosts Zelenskyy and European/NATO leaders at White House; cautious optimism, no breakthrough" },
];

const SPEED_OPTIONS = [
  { label: "0.5×", ms: 800 },
  { label: "1×", ms: 400 },
  { label: "2×", ms: 200 },
  { label: "4×", ms: 100 },
  { label: "8×", ms: 50 },
];

function formatDateDisplay(dateStr: string): string {
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  const y = dateStr.slice(0, 4);
  return `${m}/${d}/${y}`;
}

function formatDateShort(dateStr: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const m = parseInt(dateStr.slice(4, 6)) - 1;
  const d = dateStr.slice(6, 8);
  return `${months[m]} ${parseInt(d)}`;
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

const TERRITORY_DATA_START = "20240708";
const PIXELS_PER_DAY = 2;

const YEAR_MARKS = ["2022", "2023", "2024", "2025", "2026"];

export default function TimelineScrubber({
  onDateChange,
  initialDate,
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
  const [collapsed, setCollapsed] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1); // default 1× (400ms)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialScroll = useRef(true);

  // Drag-to-scroll state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // Notify parent when index changes
  useEffect(() => {
    if (currentIndex >= 0 && dates[currentIndex]) {
      onDateChange(dates[currentIndex]);
    }
  }, [currentIndex, dates, onDateChange]);

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
    [dates.length]
  );

  // Drag-to-scroll handlers for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
    },
    []
  );

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
    [dates]
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
    [dates]
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
    if (collapsed) return;
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
  }, [currentIndex, collapsed, isPlaying]);

  if (dates.length === 0) return null;

  const currentDate = dates[currentIndex] || dates[dates.length - 1];
  const totalWidth = dates.length * PIXELS_PER_DAY;

  // Event positions in pixels
  const eventPositionsPx = KEY_EVENTS.map((event) => {
    const idx = dates.findIndex((d) => d >= event.date);
    return {
      ...event,
      px: idx >= 0 ? idx * PIXELS_PER_DAY : -1,
      index: idx,
    };
  }).filter((e) => e.px >= 0);

  // All labels with two-row collision-free layout
  const labelRows = (() => {
    const MIN_LABEL_GAP = 55;
    const rows: { date: string; label: string; px: number; row: number }[] = [];
    let lastRow0 = -MIN_LABEL_GAP;
    let lastRow1 = -MIN_LABEL_GAP;

    for (const event of eventPositionsPx) {
      if (event.px - lastRow0 >= MIN_LABEL_GAP) {
        rows.push({ date: event.date, label: event.label, px: event.px, row: 0 });
        lastRow0 = event.px;
      } else if (event.px - lastRow1 >= MIN_LABEL_GAP) {
        rows.push({ date: event.date, label: event.label, px: event.px, row: 1 });
        lastRow1 = event.px;
      }
    }
    return rows;
  })();

  // Closest active event (within 5 days)
  const activeEvent = eventPositionsPx.find((event) => {
    return Math.abs(currentIndex - event.index) <= 5;
  });

  const warStart = new Date("2022-02-24");
  const currentDateObj = new Date(
    `${currentDate.slice(0, 4)}-${currentDate.slice(4, 6)}-${currentDate.slice(6, 8)}`
  );
  const warDay = Math.floor(
    (currentDateObj.getTime() - warStart.getTime()) / 86400000
  ) + 1;

  // Year boundaries in pixels
  const yearTicksPx = YEAR_MARKS
    .map((y) => {
      if (y === "2022") return { year: y, px: 0 };
      const idx = dates.indexOf(`${y}0101`);
      return idx >= 0 ? { year: y, px: idx * PIXELS_PER_DAY } : null;
    })
    .filter(Boolean) as { year: string; px: number }[];

  // Which years are available for jump buttons
  const availableYears = YEAR_MARKS.filter((y) => {
    if (y === "2022") return true;
    return dates.indexOf(`${y}0101`) >= 0;
  });

  // Current year from the timeline
  const currentYear = currentDate.slice(0, 4);

  const hasTerritoryData = currentDate >= TERRITORY_DATA_START;
  const territoryStartPx = (() => {
    const idx = dates.indexOf(TERRITORY_DATA_START);
    return idx >= 0 ? idx * PIXELS_PER_DAY : -1;
  })();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        "px-4 pb-1.5 sm:px-6 sm:pb-2"
      )}
    >
      <div
        className={cn(
          "rounded-lg",
          "bg-background/90 backdrop-blur-xl",
          "border border-border/50",
          "shadow-[0_-4px_20px_rgba(0,0,0,0.4)]",
          "transition-all duration-300"
        )}
      >
        {/* Collapsed state — just a header bar */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2",
              "rounded-lg",
              "text-xs font-semibold uppercase tracking-wider",
              "text-ua-blue",
              "hover:bg-surface-elevated/30 transition-colors"
            )}
          >
            <TbChevronDown className="h-3 w-3 text-muted-foreground rotate-180 transition-transform" />
            <span>Timeline</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
              {formatDateDisplay(currentDate)}
            </span>
          </button>
        )}

        {/* Expanded state */}
        {!collapsed && (
          <>
            {/* Event info card — shown when near key events */}
            {activeEvent && (
              <div className="mx-3 mt-2 rounded-md bg-ua-blue/10 border border-ua-blue/20 px-3 py-2 flex items-start gap-2">
                <TbInfoCircle className="h-3.5 w-3.5 text-ua-blue mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-ua-blue">
                    {activeEvent.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    {formatDateShort(activeEvent.date)}
                  </span>
                  <p className="text-[10px] text-foreground/80 mt-0.5 leading-snug">
                    {activeEvent.description}
                  </p>
                </div>
              </div>
            )}

            {/* Controls row */}
            <div className="flex items-center gap-2 px-3 pt-2 sm:gap-3">
              {/* Date info */}
              <div className="flex flex-col items-start gap-0 min-w-[100px] sm:min-w-[130px]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ua-blue">
                    Timeline
                  </span>
                  {!hasTerritoryData && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-surface-elevated text-muted-foreground">
                      No map data
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-foreground font-medium">
                    {formatDateDisplay(currentDate)}
                  </span>
                  {currentIndex < dates.length - 1 && (
                    <span className="text-[9px] text-ua-yellow/70 font-mono">
                      Day {warDay}
                    </span>
                  )}
                  {currentIndex === dates.length - 1 && (
                    <span className="text-[9px] text-capture font-mono">
                      Today
                    </span>
                  )}
                </div>
              </div>

              {/* Transport controls */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={jumpToStart}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
                  title="Jump to start"
                >
                  <TbPlayerSkipBackFilled className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleStepBack}
                  disabled={currentIndex <= 0}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <TbChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    isPlaying
                      ? "bg-ua-blue/20 text-ua-blue"
                      : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isPlaying ? (
                    <TbPlayerPauseFilled className="h-4 w-4" />
                  ) : (
                    <TbPlayerPlayFilled className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleStepForward}
                  disabled={currentIndex >= dates.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <TbChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Speed control */}
              <button
                onClick={cycleSpeed}
                className={cn(
                  "flex h-7 items-center justify-center rounded-md px-2 transition-colors",
                  "text-[10px] font-mono font-semibold",
                  isPlaying
                    ? "bg-ua-blue/15 text-ua-blue"
                    : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
                )}
                title="Playback speed"
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
                        : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-surface-elevated/50"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>

              <div className="flex-1" />

              {/* Collapse button */}
              <button
                onClick={() => setCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
              >
                <TbChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable timeline */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-none mx-3 mb-2 mt-1.5 select-none"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
            >
              <div
                className="relative cursor-crosshair"
                style={{ width: `${totalWidth}px`, height: "65px" }}
                onClick={handleTimelineClick}
              >
                {/* Track line */}
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-border/30 rounded-full" />

                {/* Territory data availability range */}
                {territoryStartPx >= 0 && (
                  <div
                    className="absolute top-2 h-2 bg-ua-blue/8 rounded-full"
                    style={{
                      left: `${territoryStartPx}px`,
                      width: `${totalWidth - territoryStartPx}px`,
                    }}
                  />
                )}

                {/* Year tick marks + labels */}
                {yearTicksPx.map((tick) => (
                  <div
                    key={tick.year}
                    className="absolute top-0"
                    style={{ left: `${tick.px}px` }}
                  >
                    <div className="w-px h-6 bg-border/40" />
                    <span className="absolute top-7 -translate-x-1/2 text-[8px] text-muted-foreground/50 whitespace-nowrap">
                      {tick.year}
                    </span>
                  </div>
                ))}

                {/* Event marker dots */}
                {eventPositionsPx.map((event) => (
                  <button
                    key={event.date}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJumpToEvent(event.date);
                    }}
                    className={cn(
                      "absolute top-1.5 -translate-x-1/2 rounded-full transition-all z-10",
                      activeEvent?.date === event.date
                        ? "w-2 h-3 bg-ua-yellow"
                        : "w-1.5 h-2.5 bg-ua-yellow/50 hover:bg-ua-yellow hover:h-3"
                    )}
                    style={{ left: `${event.px}px` }}
                    title={`${event.label}: ${event.description} (${formatDateShort(event.date)})`}
                  />
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
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: "28px" }}
                >
                  {labelRows.map((labelInfo) => {
                    const isLabelActive =
                      activeEvent?.date === labelInfo.date;
                    return (
                      <div
                        key={labelInfo.date}
                        className="absolute pointer-events-auto"
                        style={{ left: `${labelInfo.px}px` }}
                      >
                        <div className="flex flex-col items-center -translate-x-1/2">
                          <div
                            className={cn(
                              "w-px",
                              labelInfo.row === 0 ? "h-2" : "h-5",
                              isLabelActive
                                ? "bg-ua-yellow/50"
                                : "bg-border/40"
                            )}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJumpToEvent(labelInfo.date);
                            }}
                            className={cn(
                              "text-[9px] whitespace-nowrap leading-none mt-0.5",
                              "transition-colors",
                              isLabelActive
                                ? "text-ua-yellow font-semibold"
                                : "text-muted-foreground/70 hover:text-muted-foreground"
                            )}
                          >
                            {labelInfo.label}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
