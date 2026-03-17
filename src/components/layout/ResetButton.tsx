"use client";

import { cn } from "@/lib/utils";
import { TbRefresh } from "react-icons/tb";

interface ResetButtonProps {
  onReset: () => void;
}

export default function ResetButton({ onReset }: ResetButtonProps) {
  return (
    <button
      onClick={onReset}
      className={cn(
        "fixed top-[18px] right-[140px] z-40 sm:top-[22px] sm:right-[160px]",
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
        "bg-background/70 backdrop-blur-xl",
        "border border-border/40",
        "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
        "hover:text-foreground hover:border-border/60 transition-colors",
        "group"
      )}
      title="Reset timeline, map, and panels"
    >
      <TbRefresh className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
      <span className="hidden sm:inline">Reset</span>
    </button>
  );
}
