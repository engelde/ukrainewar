"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DATA_SOURCES } from "@/lib/constants";
import { TbChevronDown, TbExternalLink } from "react-icons/tb";

export default function DataSourcesPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "drag-handle flex items-center gap-1.5 px-2.5 py-1.5",
          "rounded-lg",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "text-[10px] font-semibold uppercase tracking-wider",
          "text-muted-foreground",
          "hover:bg-background/90 transition-colors",
          "cursor-grab active:cursor-grabbing",
          expanded && "rounded-b-none border-b-0"
        )}
      >
        <span>Sources</span>
        <TbChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div
          className={cn(
            "flex flex-col gap-0.5 px-2.5 py-1.5",
            "rounded-b-lg",
            "bg-background/80 backdrop-blur-xl",
            "border border-t-0 border-border/50"
          )}
        >
          {DATA_SOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] text-muted-foreground/60 hover:text-ua-blue transition-colors"
              title={source.description}
            >
              <span>{source.name}</span>
              <TbExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
