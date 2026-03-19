"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { WarEvent } from "@/data/events";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

interface DayTrackerProps {
  warDay?: number;
  territoryDate?: string | null;
  dates?: WarEvent[];
  onDateChange?: (date: string) => void;
}

export default function DayTracker({ warDay, territoryDate, onDateChange }: DayTrackerProps) {
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
    <div className="fixed top-3 right-4 z-40 sm:top-4 sm:right-6 flex items-center gap-1.5">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger
          render={
            <button
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer",
                "bg-background/70 backdrop-blur-xl",
                "border border-ua-yellow/30",
                "text-xs font-bold uppercase tracking-wider font-mono",
                "text-ua-yellow",
                "hover:border-ua-yellow/50 transition-colors",
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
