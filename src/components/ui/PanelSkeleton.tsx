"use client";

import { cn } from "@/lib/utils";

export function PanelSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5 p-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-2 animate-pulse">
          <div className="h-3.5 w-3.5 rounded bg-border/30 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-border/30" />
            <div className="h-4 w-16 rounded bg-border/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PanelError({ message = "Data unavailable" }: { message?: string }) {
  return (
    <div className="p-3 text-center">
      <p className="text-[10px] text-muted-foreground/60">{message}</p>
    </div>
  );
}
