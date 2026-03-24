import {
  TbChevronLeft,
  TbChevronRight,
  TbFlag,
  TbPlayerPauseFilled,
  TbPlayerPlayFilled,
  TbPlayerSkipBackFilled,
  TbPlayerSkipForwardFilled,
  TbTimeline,
} from "react-icons/tb";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatDateDisplay } from "./timelineConstants";

export interface TimelineControlsProps {
  currentDate: string;
  currentIndex: number;
  datesLength: number;
  isPlaying: boolean;
  speedLabel: string;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  onCalendarSelect: (date: Date | undefined) => void;
  currentYear: string;
  availableYears: string[];
  showPlayHint: boolean;
  eventsOpen?: boolean;
  onTogglePlay: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onStepBackClick: () => void;
  onStepForwardClick: () => void;
  onStepBackDown: () => void;
  onStepForwardDown: () => void;
  onStepUp: () => void;
  onCycleSpeed: () => void;
  onJumpToYear: (year: string) => void;
  onToggleEvents?: () => void;
}

export function TimelineControls({
  currentDate,
  currentIndex,
  datesLength,
  isPlaying,
  speedLabel,
  calendarOpen,
  onCalendarOpenChange,
  onCalendarSelect,
  currentYear,
  availableYears,
  showPlayHint,
  eventsOpen,
  onTogglePlay,
  onJumpToStart,
  onJumpToEnd,
  onStepBackClick,
  onStepForwardClick,
  onStepBackDown,
  onStepForwardDown,
  onStepUp,
  onCycleSpeed,
  onJumpToYear,
  onToggleEvents,
}: TimelineControlsProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3 sm:gap-3">
      {/* Date info — click to open calendar picker */}
      <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
        <PopoverTrigger
          render={
            <button className="flex flex-col items-start gap-0 min-w-[100px] sm:min-w-[130px] rounded-md hover:bg-surface-elevated/50 transition-colors px-1.5 py-1 -mx-1.5 -my-1 cursor-pointer">
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
                {currentIndex === datesLength - 1 && (
                  <span className="text-[9px] text-capture font-mono">{t("common.today")}</span>
                )}
              </div>
            </button>
          }
        />
        <PopoverContent side="top" align="start" sideOffset={8} className="w-auto p-0">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(2022, 1)}
            endMonth={new Date()}
            selected={(() => {
              const y = Number.parseInt(currentDate.slice(0, 4), 10);
              const m = Number.parseInt(currentDate.slice(4, 6), 10) - 1;
              const d = Number.parseInt(currentDate.slice(6, 8), 10);
              return new Date(y, m, d);
            })()}
            onSelect={onCalendarSelect}
            disabled={[{ before: new Date(2022, 1, 24) }, { after: new Date() }]}
            defaultMonth={(() => {
              const y = Number.parseInt(currentDate.slice(0, 4), 10);
              const m = Number.parseInt(currentDate.slice(4, 6), 10) - 1;
              return new Date(y, m, 1);
            })()}
            className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-lg"
          />
        </PopoverContent>
      </Popover>

      {/* Transport controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onJumpToStart}
          aria-label="Jump to start"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
          title={t("timeline.jumpToStart")}
        >
          <TbPlayerSkipBackFilled className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={onStepBackClick}
          onMouseDown={onStepBackDown}
          onMouseUp={onStepUp}
          onMouseLeave={onStepUp}
          disabled={currentIndex <= 0}
          aria-label="Step back one day"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <TbChevronLeft className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
            className={cn(
              "relative z-10 flex h-10 w-10 items-center justify-center rounded-md transition-colors",
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
          {showPlayHint && !isPlaying && (
            <span className="absolute inset-0 rounded-md bg-ua-blue/25 pointer-events-none animate-[ping_1s_ease-in-out_4_forwards]" />
          )}
        </div>
        <button
          onClick={onStepForwardClick}
          onMouseDown={onStepForwardDown}
          onMouseUp={onStepUp}
          onMouseLeave={onStepUp}
          disabled={currentIndex >= datesLength - 1}
          aria-label="Step forward one day"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <TbChevronRight className="h-5 w-5" />
        </button>
        <button
          onClick={onJumpToEnd}
          aria-label="Jump to today"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
          title={t("timeline.jumpToToday")}
        >
          <TbPlayerSkipForwardFilled className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Speed control */}
      <button
        onClick={onCycleSpeed}
        aria-label={`Playback speed: ${speedLabel}`}
        className={cn(
          "flex h-9 items-center justify-center rounded-md px-2.5 transition-colors",
          "text-xs font-mono font-semibold",
          isPlaying
            ? "bg-ua-blue/15 text-ua-blue"
            : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground",
        )}
        title={t("timeline.playbackSpeed")}
      >
        {speedLabel}
      </button>

      {/* Year jump buttons — desktop only */}
      <div className="hidden sm:flex items-center gap-0.5 ml-1">
        {availableYears.map((y) => (
          <button
            key={y}
            onClick={() => onJumpToYear(y)}
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

      {/* Spacer to push buttons to right */}
      <div className="flex-1" />

      {/* Events toggle */}
      {onToggleEvents && (
        <button
          onClick={onToggleEvents}
          title={t("timeline.toggleEvents")}
          aria-label="Toggle events sidebar"
          className={cn(
            "flex h-7 items-center gap-1 rounded-md px-2.5 transition-colors",
            "text-[10px] font-semibold uppercase tracking-wider",
            eventsOpen
              ? "bg-ua-yellow/15 text-ua-yellow"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
          )}
        >
          <TbFlag className="h-3 w-3" />
          <span>{t("timeline.events")}</span>
        </button>
      )}
    </div>
  );
}
