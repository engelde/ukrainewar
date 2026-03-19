"use client";

import { TbRefresh } from "react-icons/tb";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

interface ResetButtonProps {
  onReset: () => void;
  warDay?: number;
  isHistorical?: boolean;
}

export default function ResetButton({ onReset, warDay, isHistorical }: ResetButtonProps) {
  return (
    <div className="fixed top-3 right-4 z-40 sm:top-4 sm:right-6 flex items-center gap-1.5">
      {warDay !== undefined && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2",
            "bg-background/70 backdrop-blur-xl",
            "border border-ua-yellow/30",
            "text-xs font-bold uppercase tracking-wider font-mono",
            "text-ua-yellow",
          )}
        >
          {t("common.day")} {warDay.toLocaleString()}
        </div>
      )}
      {isHistorical && (
        <button
          onClick={onReset}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
            "bg-background/70 backdrop-blur-xl",
            "border border-border/40",
            "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
            "hover:text-foreground hover:border-border/60 transition-colors",
            "group",
          )}
          title={t("timeline.resetTooltip")}
        >
          <TbRefresh className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
          <span className="hidden sm:inline">{t("common.reset")}</span>
        </button>
      )}
    </div>
  );
}
