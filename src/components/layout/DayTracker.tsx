"use client";

import { useState } from "react";
import { TbRefresh } from "react-icons/tb";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { WarEvent } from "@/data/events";
import { t } from "@/i18n";
import type { MapLayers } from "@/lib/types";
import { cn } from "@/lib/utils";
import OptionsPopup from "./OptionsPopup";

interface PanelToggles {
  events?: () => void;
  russianLosses?: () => void;
  humanitarian?: () => void;
  spending?: () => void;
  energy?: () => void;
  airDefense?: () => void;
  support?: () => void;
  ukraineLosses?: () => void;
  sanctions?: () => void;
}

interface PanelStates {
  events?: boolean;
  russianLosses?: boolean;
  humanitarian?: boolean;
  spending?: boolean;
  energy?: boolean;
  airDefense?: boolean;
  support?: boolean;
  ukraineLosses?: boolean;
  sanctions?: boolean;
}

interface DayTrackerProps {
  warDay?: number;
  territoryDate?: string | null;
  dates?: WarEvent[];
  onDateChange?: (date: string) => void;
  onReset?: () => void;
  panelToggles?: PanelToggles;
  panelStates?: PanelStates;
  layers?: MapLayers;
  onToggleLayer?: (layer: keyof MapLayers) => void;
}

export default function DayTracker({
  warDay,
  territoryDate,
  onDateChange,
  onReset,
  panelToggles,
  panelStates,
  layers,
  onToggleLayer,
}: DayTrackerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (warDay === undefined) return null;

  const selectedDate = territoryDate
    ? new Date(
        parseInt(territoryDate.slice(0, 4), 10),
        parseInt(territoryDate.slice(4, 6), 10) - 1,
        parseInt(territoryDate.slice(6, 8), 10),
      )
    : new Date();

  return (
    <div className="fixed top-3 right-4 z-40 sm:top-4 sm:right-6 flex items-center gap-0.5 bg-background/70 backdrop-blur-xl rounded-lg px-3 py-1.5 border border-border/40">
      {onReset && (
        <button
          onClick={onReset}
          aria-label="Reset view"
          title={t("timeline.resetTooltip")}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 cursor-pointer",
            "text-[0.625rem] font-semibold uppercase tracking-wider",
            "transition-colors group",
            "text-muted-foreground/70 hover:text-muted-foreground",
          )}
        >
          <TbRefresh className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
          <span className="hidden lg:inline">{t("common.reset")}</span>
        </button>
      )}
      <OptionsPopup
        panelToggles={panelToggles}
        panelStates={panelStates}
        layers={layers}
        onToggleLayer={onToggleLayer}
      />
      <div className="w-px h-4 bg-border/40" />
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger
          render={
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer",
                "text-sm font-bold uppercase tracking-wider font-mono",
                "text-ua-yellow",
                "hover:text-ua-yellow/80 transition-colors",
              )}
            >
              {t("common.day")} {warDay.toLocaleString()}
            </button>
          }
        />
        <PopoverContent side="bottom" align="end" sideOffset={8} className="w-auto p-0">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(2022, 1)}
            endMonth={new Date()}
            selected={selectedDate}
            onSelect={(date) => {
              if (!date || !onDateChange) return;
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              onDateChange(`${y}${m}${d}`);
              setCalendarOpen(false);
            }}
            disabled={[{ before: new Date(2022, 1, 24) }, { after: new Date() }]}
            defaultMonth={new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)}
            className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-lg"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
