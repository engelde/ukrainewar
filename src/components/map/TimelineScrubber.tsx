"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  TbPlayerPlayFilled,
  TbPlayerPauseFilled,
  TbChevronLeft,
  TbChevronRight,
  TbX,
  TbInfoCircle,
} from "react-icons/tb";

interface TimelineScrubberProps {
  onDateChange: (date: string) => void;
  onClose: () => void;
}

// Key events in the war for timeline markers
const KEY_EVENTS: { date: string; label: string; description: string }[] = [
  { date: "20240708", label: "Dataset begins", description: "DeepState territory tracking data starts" },
  { date: "20240806", label: "Kursk offensive", description: "Ukraine launches surprise cross-border offensive into Kursk Oblast" },
  { date: "20241005", label: "Vuhledar falls", description: "Russia captures Vuhledar after prolonged siege" },
  { date: "20241105", label: "US election", description: "Donald Trump wins US presidential election" },
  { date: "20241216", label: "DPRK troops deployed", description: "North Korean soldiers confirmed fighting alongside Russian forces" },
  { date: "20250120", label: "Trump inaugurated", description: "Trump takes office, signals shift in Ukraine policy" },
  { date: "20250224", label: "3rd anniversary", description: "Three years since Russia's full-scale invasion of Ukraine" },
];

function formatDateDisplay(dateStr: string): string {
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return `${y}-${m}-${d}`;
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

export default function TimelineScrubber({
  onDateChange,
  onClose,
}: TimelineScrubberProps) {
  const [dates, setDates] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available dates
  useEffect(() => {
    async function fetchDates() {
      try {
        const res = await fetch("/api/territory/dates");
        if (!res.ok) return;
        const data = await res.json();
        setDates(data.dates || []);
        setCurrentIndex(data.dates.length - 1); // Start at latest
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    fetchDates();
  }, []);

  // Notify parent when index changes
  useEffect(() => {
    if (currentIndex >= 0 && dates[currentIndex]) {
      onDateChange(dates[currentIndex]);
    }
  }, [currentIndex, dates, onDateChange]);

  // Play/pause animation
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
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
      }, 400);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, dates.length]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value);
      setCurrentIndex(idx);
      setIsPlaying(false);
    },
    []
  );

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

  const handleStepBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    setCurrentIndex((prev) => Math.min(dates.length - 1, prev + 1));
    setIsPlaying(false);
  }, [dates.length]);

  if (loading) {
    return (
      <div
        className={cn(
          "fixed bottom-12 left-1/2 -translate-x-1/2 z-30",
          "rounded-lg px-6 py-3",
          "bg-background/85 backdrop-blur-xl",
          "border border-border/50"
        )}
      >
        <span className="text-xs text-muted-foreground">
          Loading timeline...
        </span>
      </div>
    );
  }

  if (dates.length === 0) return null;

  const currentDate = dates[currentIndex] || dates[dates.length - 1];

  // Calculate key event positions as percentages
  const eventPositions = KEY_EVENTS.map((event) => {
    const idx = dates.findIndex((d) => d >= event.date);
    return {
      ...event,
      position: idx >= 0 ? (idx / (dates.length - 1)) * 100 : -1,
      index: idx,
    };
  }).filter((e) => e.position >= 0);

  // Find the closest active event (within 5 days of current date)
  const activeEvent = eventPositions.find((event) => {
    const eventIdx = event.index;
    return Math.abs(currentIndex - eventIdx) <= 5;
  });

  return (
    <div
      className={cn(
        "fixed bottom-12 left-1/2 -translate-x-1/2 z-30",
        "w-[calc(100%-2rem)] max-w-3xl",
        "sm:bottom-14",
        "rounded-lg",
        "bg-background/85 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30"
      )}
    >
      {/* Event info card — shown when near key events */}
      {activeEvent && (
        <div className="mx-3 mt-2 rounded-md bg-ua-blue/10 border border-ua-blue/20 px-3 py-2 flex items-start gap-2">
          <TbInfoCircle className="h-3.5 w-3.5 text-ua-blue mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-ua-blue">
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

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ua-blue">
            War Timeline
          </span>
          <span className="text-xs font-mono text-foreground">
            {formatDateDisplay(currentDate)}
          </span>
          {currentIndex < dates.length - 1 && (
            <span className="text-[9px] text-ua-yellow/70 font-mono">
              {currentIndex < dates.length - 1 ? `−${dates.length - 1 - currentIndex}d` : ""}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
        >
          <TbX className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Controls + Slider */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Step back */}
          <button
            onClick={handleStepBack}
            disabled={currentIndex <= 0}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <TbChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              isPlaying
                ? "bg-ua-blue/20 text-ua-blue"
                : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            {isPlaying ? (
              <TbPlayerPauseFilled className="h-3.5 w-3.5" />
            ) : (
              <TbPlayerPlayFilled className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Step forward */}
          <button
            onClick={handleStepForward}
            disabled={currentIndex >= dates.length - 1}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <TbChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Slider */}
          <div className="relative flex-1">
            {/* Event markers */}
            <div className="absolute inset-0 pointer-events-none">
              {eventPositions.map((event) => (
                <button
                  key={event.date}
                  onClick={() => handleJumpToEvent(event.date)}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-ua-yellow/60 rounded-full pointer-events-auto hover:bg-ua-yellow transition-colors"
                  style={{ left: `${event.position}%` }}
                  title={`${event.label}: ${event.description} (${formatDateShort(event.date)})`}
                />
              ))}
            </div>

            <input
              type="range"
              min={0}
              max={dates.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              className="timeline-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Date range labels */}
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatDateShort(dates[dates.length - 1])}
          </span>
        </div>

        {/* Key event labels */}
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {eventPositions.map((event) => (
            <button
              key={event.date}
              onClick={() => handleJumpToEvent(event.date)}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded",
                "transition-colors",
                dates[currentIndex] === dates[dates.findIndex((d) => d >= event.date)]
                  ? "bg-ua-yellow/20 text-ua-yellow"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
              )}
            >
              {event.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
