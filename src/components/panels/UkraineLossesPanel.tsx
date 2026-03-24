"use client";

import { memo, useMemo } from "react";
import { TbAlertTriangle, TbChevronDown, TbInfoCircle, TbUserMinus } from "react-icons/tb";
import { getUkraineLossSummary } from "@/data/ukraine-losses";
import { t } from "@/i18n";
import { cn, formatDateDisplay } from "@/lib/utils";

interface UkraineLossesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string;
}

function formatNumber(n: number | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return n.toLocaleString();
  return n.toLocaleString();
}

function UkraineLossesPanelInner({ isOpen, onToggle, timelineDate }: UkraineLossesPanelProps) {
  const summary = useMemo(() => getUkraineLossSummary(timelineDate), [timelineDate]);
  const mz = summary.mediazonaConfirmed;

  if (!isOpen) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "overflow-hidden",
        )}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 flex-1">
          <TbUserMinus className="h-3.5 w-3.5 text-[#005BBB]" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("ukraineLosses.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand Ukrainian losses panel"
          className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3 w-3 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-[calc(100vw-1.5rem)] sm:w-[340px]",
        "max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]",
        "overflow-y-auto",
        "rounded-lg",
        "bg-background/80 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30",
      )}
    >
      {/* Header */}
      <div className="drag-handle sticky top-0 z-10 bg-background/90 backdrop-blur-sm px-3 py-2 border-b border-border/30 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <TbUserMinus className="h-3.5 w-3.5 text-[#005BBB]" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[#005BBB]">
            {t("ukraineLosses.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close Ukrainian losses panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-2.5 space-y-2.5">
        {/* Confirmed by name — Mediazona */}
        <div className="text-center pb-2.5 border-b border-border/20">
          <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
            Confirmed killed by name
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#FFD500]">
            {formatNumber(mz?.militaryKilled)}
          </div>
          <div className="text-[0.5625rem] text-muted-foreground/60 mt-0.5">
            Verified by Mediazona &amp; BBC News Russian
          </div>
          {mz && (
            <div className="text-[0.5rem] text-muted-foreground/40 mt-0.5">
              as of {formatDateDisplay(mz.date)}
            </div>
          )}
        </div>

        {/* Methodology note */}
        <div className="px-2 py-1.5 rounded-md bg-[#005BBB]/10 border border-[#005BBB]/20">
          <div className="flex items-start gap-1.5">
            <TbInfoCircle className="h-3 w-3 text-[#005BBB] shrink-0 mt-0.5" />
            <div className="text-[0.5rem] text-muted-foreground/70 leading-relaxed space-y-1">
              <p>
                This panel shows only deaths confirmed by name through open-source investigation by
                Mediazona and BBC News Russian. Each casualty is individually verified through
                obituaries, social media posts, official records, and media reports.
              </p>
              <p>
                The actual toll is believed to be significantly higher. Confirmed-by-name figures
                represent a verified minimum, not a comprehensive count.
              </p>
            </div>
          </div>
        </div>

        {/* Why only confirmed data */}
        <div className="px-2 py-1.5 rounded-md bg-[#DD6B20]/10 border border-[#DD6B20]/20">
          <div className="flex items-start gap-1.5">
            <TbAlertTriangle className="h-3 w-3 text-[#DD6B20] shrink-0 mt-0.5" />
            <p className="text-[0.5rem] text-muted-foreground/70 leading-relaxed">
              Estimates from governments and intelligence agencies vary widely and cannot be
              independently verified. This tracker displays only data that meets the standard of
              individual name-level confirmation. Civilian casualty data is tracked separately in
              the Humanitarian panel using UN OHCHR verified figures.
            </p>
          </div>
        </div>
      </div>

      {/* Source footer */}
      <div className="px-3 py-1.5 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-[0.5rem] text-muted-foreground/50">
          <span>Source:</span>
          <a
            href="https://en.zona.media/article/2022/05/20/casualties_eng"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#005BBB] transition-colors"
          >
            Mediazona / BBC News Russian
          </a>
        </div>
      </div>
    </div>
  );
}

const UkraineLossesPanel = memo(UkraineLossesPanelInner);
export default UkraineLossesPanel;
