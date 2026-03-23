"use client";

import { memo, useMemo } from "react";
import { TbAlertTriangle, TbChevronDown, TbShield, TbUserMinus, TbX } from "react-icons/tb";
import {
  CIVILIAN_CASUALTIES_OHCHR,
  getUkraineLossSummary,
  UKRAINE_LOSS_ESTIMATES,
  type UkraineLossEstimate,
} from "@/data/ukraine-losses";
import { cn, formatDateDisplay } from "@/lib/utils";

interface UkraineLossesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string;
}

function formatNumber(n: number | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function findClosestEstimate(
  date: string,
  estimates: UkraineLossEstimate[],
): UkraineLossEstimate | null {
  if (estimates.length === 0) return null;
  let closest = estimates[0];
  let minDiff = Math.abs(parseInt(date, 10) - parseInt(closest.date, 10));
  for (const est of estimates) {
    const diff = Math.abs(parseInt(date, 10) - parseInt(est.date, 10));
    if (diff < minDiff) {
      minDiff = diff;
      closest = est;
    }
  }
  return closest;
}

function KeyFigure({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className={cn("text-sm font-bold font-mono tabular-nums", accent)}>{value}</div>
      <div className="text-[8px] text-muted-foreground/60 truncate">{sub}</div>
    </div>
  );
}

function EstimateRow({
  estimate,
  isHighlighted,
}: {
  estimate: UkraineLossEstimate;
  isHighlighted: boolean;
}) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 rounded-md transition-colors",
        isHighlighted
          ? "bg-[#005BBB]/15 border border-[#005BBB]/30"
          : "hover:bg-surface-elevated/30",
      )}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[9px] font-mono text-muted-foreground tabular-nums shrink-0">
          {formatDateDisplay(estimate.date)}
        </span>
        <span className="text-[9px] text-foreground/80 truncate flex-1">{estimate.source}</span>
        {estimate.sourceUrl && (
          <a
            href={estimate.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] text-[#005BBB]/60 hover:text-[#005BBB] transition-colors shrink-0"
          >
            src
          </a>
        )}
      </div>

      <div className="flex items-center gap-3 text-[9px]">
        {estimate.militaryKilled != null && (
          <span className="font-mono tabular-nums text-[#E53E3E]">
            <span className="text-muted-foreground/50">KIA </span>
            {formatNumber(estimate.militaryKilled)}
          </span>
        )}
        {estimate.militaryWounded != null && (
          <span className="font-mono tabular-nums text-[#DD6B20]">
            <span className="text-muted-foreground/50">WIA </span>
            {formatNumber(estimate.militaryWounded)}
          </span>
        )}
        {estimate.militaryTotal != null && (
          <span className="font-mono tabular-nums text-foreground/70">
            <span className="text-muted-foreground/50">Total </span>
            {formatNumber(estimate.militaryTotal)}
          </span>
        )}
        {estimate.civilianKilled != null && (
          <span className="font-mono tabular-nums text-[#805AD5]">
            <span className="text-muted-foreground/50">Civ. </span>
            {formatNumber(estimate.civilianKilled)}
          </span>
        )}
      </div>

      <p className="text-[8px] text-muted-foreground/60 leading-relaxed mt-0.5">{estimate.notes}</p>
    </div>
  );
}

function UkraineLossesPanelInner({ isOpen, onToggle, timelineDate }: UkraineLossesPanelProps) {
  const summary = useMemo(() => getUkraineLossSummary(), []);

  const closestEstimate = useMemo(
    () => (timelineDate ? findClosestEstimate(timelineDate, UKRAINE_LOSS_ESTIMATES) : null),
    [timelineDate],
  );

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
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            UA Losses
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
        "w-[calc(100vw-1.5rem)] sm:w-[420px]",
        "max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]",
        "overflow-y-auto",
        "rounded-lg",
        "bg-background/85 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30",
      )}
    >
      {/* Header */}
      <div className="drag-handle sticky top-0 z-10 bg-background/90 backdrop-blur-sm px-3 py-2 border-b border-border/30 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <TbUserMinus className="h-3.5 w-3.5 text-[#005BBB]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#005BBB]">
            Ukrainian Losses
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close Ukrainian losses panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-2.5 space-y-2.5">
        {/* Key figures */}
        <div className="flex gap-2 pb-2 border-b border-border/20">
          <KeyFigure
            label="Latest estimate"
            value={formatNumber(
              summary.latestEstimate.militaryKilled ?? summary.latestEstimate.militaryTotal,
            )}
            sub={summary.latestEstimate.source}
            accent="text-[#E53E3E]"
          />
          <div className="w-px bg-border/30 shrink-0" />
          <KeyFigure
            label="Mediazona confirmed"
            value={formatNumber(summary.mediazonaConfirmed?.militaryKilled)}
            sub="Named deaths"
            accent="text-[#FFD500]"
          />
          <div className="w-px bg-border/30 shrink-0" />
          <KeyFigure
            label="OHCHR civilian"
            value={formatNumber(summary.civilianOHCHR.killed)}
            sub={`+ ${formatNumber(summary.civilianOHCHR.injured)} injured`}
            accent="text-[#805AD5]"
          />
        </div>

        {/* Civilian OHCHR detail */}
        <div className="px-2 py-1.5 rounded-md bg-[#805AD5]/10 border border-[#805AD5]/20">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TbShield className="h-3 w-3 text-[#805AD5]" />
            <span className="text-[9px] font-semibold text-[#805AD5] uppercase tracking-wider">
              UN OHCHR Civilian Casualties
            </span>
          </div>
          <div className="flex gap-3 text-[9px] font-mono tabular-nums">
            <span className="text-[#E53E3E]">
              {CIVILIAN_CASUALTIES_OHCHR.killed.toLocaleString()} killed
            </span>
            <span className="text-[#DD6B20]">
              {CIVILIAN_CASUALTIES_OHCHR.injured.toLocaleString()} injured
            </span>
            <span className="text-muted-foreground/50">
              as of {formatDateDisplay(CIVILIAN_CASUALTIES_OHCHR.asOf)}
            </span>
          </div>
          <p className="text-[8px] text-muted-foreground/60 leading-relaxed mt-0.5">
            {CIVILIAN_CASUALTIES_OHCHR.notes}
          </p>
        </div>

        {/* Timeline of estimates */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Estimate timeline
            </span>
            <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
              {UKRAINE_LOSS_ESTIMATES.length} reports
            </span>
          </div>
          <div className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/30">
            {UKRAINE_LOSS_ESTIMATES.map((est) => (
              <EstimateRow
                key={`${est.date}-${est.source}`}
                estimate={est}
                isHighlighted={closestEstimate === est && timelineDate != null}
              />
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-2 py-1.5 rounded-md bg-[#DD6B20]/10 border border-[#DD6B20]/20">
          <div className="flex items-start gap-1.5">
            <TbAlertTriangle className="h-3 w-3 text-[#DD6B20] shrink-0 mt-0.5" />
            <p className="text-[8px] text-muted-foreground/70 leading-relaxed">
              {summary.disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* Source footer */}
      <div className="px-3 py-1.5 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/50">
          <span>Sources:</span>
          <a
            href="https://en.zona.media/article/2022/05/20/casualties_eng"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#005BBB] transition-colors"
          >
            Mediazona
          </a>
          <span>/</span>
          <a
            href="https://www.ohchr.org/en/news/press-releases"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#005BBB] transition-colors"
          >
            OHCHR
          </a>
          <span className="mx-0.5">&middot;</span>
          <span>Multi-source</span>
        </div>
      </div>
    </div>
  );
}

const UkraineLossesPanel = memo(UkraineLossesPanelInner);
export default UkraineLossesPanel;
