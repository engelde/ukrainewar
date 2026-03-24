"use client";

import { memo, useMemo, useState } from "react";
import {
  TbChevronDown,
  TbChevronUp,
  TbCoin,
  TbGlobe,
  TbHandStop,
  TbHeartHandshake,
  TbShield,
  TbSword,
  TbUsers,
} from "react-icons/tb";
import {
  type CountrySupport,
  INTERNATIONAL_SUPPORT,
  SUPPORT_STATS,
  type SupportType,
} from "@/data/international-support";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

interface InternationalSupportPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SUPPORT_TYPE_CONFIG: Record<SupportType, { label: string; bg: string; text: string }> = {
  military: { label: "Military", bg: "bg-[#DD6B20]/20", text: "text-[#DD6B20]" },
  financial: { label: "Financial", bg: "bg-[#38A169]/20", text: "text-[#38A169]" },
  humanitarian: { label: "Humanitarian", bg: "bg-[#3182CE]/20", text: "text-[#3182CE]" },
  political: { label: "Political", bg: "bg-[#805AD5]/20", text: "text-[#805AD5]" },
  sanctions: { label: "Sanctions", bg: "bg-[#D69E2E]/20", text: "text-[#D69E2E]" },
  troops: { label: "Troops", bg: "bg-[#E53E3E]/20", text: "text-[#E53E3E]" },
};

const SUPPORT_TYPE_ICON: Record<SupportType, React.ReactNode> = {
  military: <TbSword className="h-2.5 w-2.5" />,
  financial: <TbCoin className="h-2.5 w-2.5" />,
  humanitarian: <TbHeartHandshake className="h-2.5 w-2.5" />,
  political: <TbGlobe className="h-2.5 w-2.5" />,
  sanctions: <TbHandStop className="h-2.5 w-2.5" />,
  troops: <TbUsers className="h-2.5 w-2.5" />,
};

function formatAid(n: number): string {
  if (n >= 10) return `$${n.toFixed(0)}B`;
  if (n >= 1) return `$${n.toFixed(1)}B`;
  if (n >= 0.1) return `$${(n * 1000).toFixed(0)}M`;
  return `$${(n * 1000).toFixed(0)}M`;
}

function SupportBadge({ type }: { type: SupportType }) {
  const config = SUPPORT_TYPE_CONFIG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium",
        config.bg,
        config.text,
      )}
    >
      {SUPPORT_TYPE_ICON[type]}
      {t(`support.${type}`)}
    </span>
  );
}

function CountryRow({ country }: { country: CountrySupport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md hover:bg-surface-elevated/30 transition-colors">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-2 px-1.5 py-1 text-left"
      >
        <span className="text-[10px] text-foreground/80 flex-1 truncate">{country.country}</span>
        <span className="text-[8px] font-mono uppercase tracking-wider bg-surface-elevated/50 px-1 py-0.5 rounded text-muted-foreground shrink-0">
          {country.countryCode}
        </span>
        {country.totalAidBillionUSD != null && country.totalAidBillionUSD > 0 && (
          <span className="text-[9px] font-mono text-foreground/70 tabular-nums shrink-0">
            {formatAid(country.totalAidBillionUSD)}
          </span>
        )}
        {expanded ? (
          <TbChevronUp className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
        ) : (
          <TbChevronDown className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-1.5 pb-1.5 space-y-1">
          <div className="flex flex-wrap gap-1">
            {country.supportTypes.map((type) => (
              <SupportBadge key={type} type={type} />
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground leading-relaxed">{country.description}</p>
          {country.notable && (
            <p className="text-[8px] text-muted-foreground/70 italic">{country.notable}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SideSection({
  title,
  accentColor,
  countries,
  totalAid,
}: {
  title: string;
  accentColor: string;
  countries: CountrySupport[];
  totalAid?: number;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between px-1.5 mb-1.5">
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", accentColor)}>
          {title}
        </span>
        <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
          {countries.length} {t("support.countries")}
        </span>
      </div>
      {totalAid != null && totalAid > 0 && (
        <div className="px-1.5 mb-1.5">
          <span className="text-[9px] text-muted-foreground">Total aid: </span>
          <span className={cn("text-[10px] font-mono font-semibold tabular-nums", accentColor)}>
            {formatAid(totalAid)}
          </span>
        </div>
      )}
      <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/30 space-y-0.5">
        {countries.map((c) => (
          <CountryRow key={c.countryCode} country={c} />
        ))}
      </div>
    </div>
  );
}

function InternationalSupportPanelInner({ isOpen, onToggle }: InternationalSupportPanelProps) {
  const ukraineSupporters = useMemo(
    () =>
      INTERNATIONAL_SUPPORT.filter((c) => c.side === "ukraine").sort(
        (a, b) => (b.totalAidBillionUSD ?? 0) - (a.totalAidBillionUSD ?? 0),
      ),
    [],
  );

  const russiaSupporters = useMemo(
    () => INTERNATIONAL_SUPPORT.filter((c) => c.side === "russia"),
    [],
  );

  const uaCount = ukraineSupporters.length;
  const ruCount = russiaSupporters.length;
  const total = uaCount + ruCount;
  const uaPct = total > 0 ? (uaCount / total) * 100 : 50;

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
          <TbShield className="h-3.5 w-3.5 text-[#005BBB]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("support.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand international support panel"
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
        "w-[calc(100vw-1.5rem)] sm:w-[460px]",
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
          <TbShield className="h-3.5 w-3.5 text-[#005BBB]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#005BBB]">
            {t("support.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close international support panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-2.5 space-y-2.5">
        {/* Summary proportion bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline px-1">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {t("support.globalAlignment")}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
              {total} {t("support.countries")}
            </span>
          </div>

          <div className="h-3 flex rounded-full overflow-hidden">
            <div
              className="h-full bg-[#005BBB]/70 transition-all duration-700 flex items-center justify-center"
              style={{ width: `${uaPct}%` }}
              title={`Ukraine: ${uaCount} countries`}
            >
              {uaPct > 20 && (
                <span className="text-[7px] font-semibold text-white/90">{uaCount}</span>
              )}
            </div>
            <div
              className="h-full bg-[#C53030]/70 transition-all duration-700 flex items-center justify-center"
              style={{ width: `${100 - uaPct}%` }}
              title={`Russia: ${ruCount} countries`}
            >
              {100 - uaPct > 15 && (
                <span className="text-[7px] font-semibold text-white/90">{ruCount}</span>
              )}
            </div>
          </div>

          <div className="flex justify-between text-[9px] px-1">
            <span className="text-[#005BBB]/80 font-mono tabular-nums">
              {uaCount} {t("support.proUkraine")}
            </span>
            <span className="text-[#C53030]/80 font-mono tabular-nums">
              {ruCount} {t("support.proRussia")}
            </span>
          </div>
        </div>

        {/* Aid total */}
        <div className="text-center pb-1.5 border-t border-b border-border/20 pt-1.5">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
            {t("support.totalAid")}
          </div>
          <div className="text-lg font-bold text-[#005BBB] font-mono tabular-nums">
            {formatAid(SUPPORT_STATS.totalUkraineAidBillionUSD)}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <SideSection
            title={t("support.supportingUkraine")}
            accentColor="text-[#005BBB]"
            countries={ukraineSupporters}
            totalAid={SUPPORT_STATS.totalUkraineAidBillionUSD}
          />
          <div className="hidden sm:block w-px bg-border/30 shrink-0" />
          <div className="block sm:hidden h-px bg-border/30" />
          <SideSection
            title={t("support.supportingRussia")}
            accentColor="text-[#C53030]"
            countries={russiaSupporters}
          />
        </div>
      </div>

      {/* Source footer */}
      <div className="px-3 py-1.5 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/50">
          <span>Sources:</span>
          <a
            href="https://www.ifw-kiel.de/topics/war-against-ukraine/ukraine-support-tracker/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ua-blue transition-colors"
          >
            Kiel Institute
          </a>
          <span>/</span>
          <span>Open data</span>
          <span className="mx-0.5">&middot;</span>
          <span>2025-01</span>
        </div>
      </div>
    </div>
  );
}

const InternationalSupportPanel = memo(InternationalSupportPanelInner);
export default InternationalSupportPanel;
