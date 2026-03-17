"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TbChevronDown,
  TbChevronUp,
  TbCoin,
  TbHeartHandshake,
  TbHome,
  TbUsers,
  TbWorld,
} from "react-icons/tb";
import { cn } from "@/lib/utils";

interface RefugeeData {
  summary: {
    total_refugees: number;
    total_idps: number;
    total_countries: number;
    latest_year: number;
  };
  yearly: {
    year: number;
    refugees: number;
    idps: number;
    returned_idps: number;
  }[];
  countries: { country: string; iso: string; refugees: number }[];
}

interface FundingData {
  summary: {
    total_required_usd: number;
    total_funded_usd: number;
    overall_pct: number;
  };
  appeals: {
    name: string;
    requirements_usd: number;
    funding_usd: number;
    funding_pct: number;
    year: number;
  }[];
}

function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatUSD(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function BarChart({
  items,
  maxValue,
}: {
  items: { label: string; value: number }[];
  maxValue: number;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-16 truncate text-right">
            {item.label}
          </span>
          <div className="flex-1 h-2.5 bg-surface-elevated/50 rounded-sm overflow-hidden">
            <div
              className="h-full bg-ua-blue/60 rounded-sm transition-all duration-500"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-foreground/70 w-10 text-right font-mono">
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function FundingBar({
  funded,
  required,
  pct,
  label,
}: {
  funded: number;
  required: number;
  pct: number;
  label: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[9px] text-muted-foreground">{label}</span>
        <span className="text-[9px] font-mono text-foreground/70">
          {formatUSD(funded)} / {formatUSD(required)}
        </span>
      </div>
      <div className="h-2 bg-surface-elevated/50 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            pct >= 75 ? "bg-capture/60" : pct >= 50 ? "bg-ua-yellow/50" : "bg-destruction/50",
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-right">
        <span className="text-[9px] font-mono text-muted-foreground">{pct}% funded</span>
      </div>
    </div>
  );
}

interface CivilianCasualtiesData {
  cumulativeTotal: { killed: number; injured: number; total: number };
  cumulativeAsOfDate: string;
  monthly: { month: string; killed: number; injured: number }[];
}

interface HumanitarianPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string; // YYYYMMDD format
}

function getCumulativeCasualties(
  data: CivilianCasualtiesData,
  timelineDate?: string,
): { killed: number; injured: number } {
  if (!timelineDate) return data.cumulativeTotal;
  const year = timelineDate.slice(0, 4);
  const month = timelineDate.slice(4, 6);
  const targetMonth = `${year}-${month}`;
  let killed = 0;
  let injured = 0;
  for (const m of data.monthly) {
    if (m.month > targetMonth) break;
    killed += m.killed;
    injured += m.injured;
  }
  return { killed, injured };
}

export default function HumanitarianPanel({
  isOpen,
  onToggle,
  timelineDate,
}: HumanitarianPanelProps) {
  const [refugees, setRefugees] = useState<RefugeeData | null>(null);
  const [funding, setFunding] = useState<FundingData | null>(null);
  const [casualties, setCasualties] = useState<CivilianCasualtiesData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const [refRes, fundRes, casRes] = await Promise.all([
          fetch("/api/humanitarian/refugees", { signal: controller.signal }),
          fetch("/api/humanitarian/funding", { signal: controller.signal }),
          fetch("/api/humanitarian/civilian-casualties", { signal: controller.signal }),
        ]);
        if (refRes.ok) setRefugees(await refRes.json());
        if (fundRes.ok) setFunding(await fundRes.json());
        if (casRes.ok) setCasualties(await casRes.json());
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError")
          console.error("Humanitarian fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  const today = new Date().toISOString().replace(/-/g, "").slice(0, 8);
  const isHistorical = !!timelineDate && timelineDate !== today;

  const currentCasualties = useMemo(() => {
    if (!casualties) return { killed: 13883, injured: 41378 };
    return getCumulativeCasualties(casualties, isHistorical ? timelineDate : undefined);
  }, [casualties, timelineDate, isHistorical]);

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
          <TbHeartHandshake className="h-3.5 w-3.5 text-ua-yellow" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Humanitarian
          </span>
        </div>
        <button
          onClick={onToggle}
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
        "w-[calc(100vw-1.5rem)] sm:w-64",
        "max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]",
        "overflow-y-auto",
        "rounded-lg",
        "bg-background/85 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30",
      )}
    >
      {/* Header — also serves as drag handle */}
      <div className="drag-handle sticky top-0 bg-background/90 backdrop-blur-sm px-3 py-2 border-b border-border/30 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <TbHeartHandshake className="h-3.5 w-3.5 text-ua-yellow" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ua-yellow">
            Humanitarian
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="px-3 py-3 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="h-3.5 w-3.5 rounded bg-border/30" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-border/30" />
                <div className="h-4 w-16 rounded bg-border/20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refugees Section */}
      <div className={cn("border-b border-border/20", loading && "hidden")}>
        <button
          onClick={() => setExpandedSection(expandedSection === "refugees" ? null : "refugees")}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-elevated/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TbWorld className="h-3.5 w-3.5 text-ua-blue" />
            <div className="text-left">
              <div className="text-xs text-foreground">Refugees Abroad</div>
              <div className="text-sm font-semibold text-foreground font-mono">
                {refugees ? formatNumber(refugees.summary.total_refugees) : "..."}
              </div>
            </div>
          </div>
          {expandedSection === "refugees" ? (
            <TbChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <TbChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
        {expandedSection === "refugees" && refugees && (
          <div className="px-3 pb-2.5 space-y-1.5">
            <div className="text-[9px] text-muted-foreground mb-1">
              Top host countries ({refugees.summary.latest_year})
            </div>
            <BarChart
              items={refugees.countries.slice(0, 8).map((c) => ({
                label: c.country
                  .replace("United Kingdom of Great Britain and Northern Ireland", "UK")
                  .replace("Rep. of Moldova", "Moldova")
                  .replace("Netherlands (Kingdom of the)", "Netherlands"),
                value: c.refugees,
              }))}
              maxValue={refugees.countries[0]?.refugees || 1}
            />
            <div className="text-[9px] text-muted-foreground mt-1">
              Across {refugees.summary.total_countries} countries
            </div>
          </div>
        )}
      </div>

      {/* IDPs Section */}
      <div className={cn("border-b border-border/20", loading && "hidden")}>
        <button
          onClick={() => setExpandedSection(expandedSection === "idps" ? null : "idps")}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-elevated/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TbHome className="h-3.5 w-3.5 text-damage" />
            <div className="text-left">
              <div className="text-xs text-foreground">Internally Displaced</div>
              <div className="text-sm font-semibold text-foreground font-mono">
                {refugees ? formatNumber(refugees.summary.total_idps) : "..."}
              </div>
            </div>
          </div>
          {expandedSection === "idps" ? (
            <TbChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <TbChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
        {expandedSection === "idps" && refugees && (
          <div className="px-3 pb-2.5">
            <div className="grid grid-cols-2 gap-2">
              {refugees.yearly
                .filter((y: { year: number }) => y.year >= 2022)
                .map((y: { year: number; idps: number; returned_idps: number }) => (
                  <div key={y.year} className="bg-surface-elevated/30 rounded px-2 py-1.5">
                    <div className="text-[9px] text-muted-foreground">{y.year}</div>
                    <div className="text-[11px] font-mono text-foreground">
                      {formatNumber(y.idps)}
                    </div>
                    {y.returned_idps > 0 && (
                      <div className="text-[9px] text-capture">
                        ↩ {formatNumber(y.returned_idps)} returned
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Civilian Casualties */}
      <div className={cn("border-b border-border/20", loading && "hidden")}>
        <div className="flex items-center gap-2 px-3 py-2">
          <TbUsers className="h-3.5 w-3.5 text-destruction" />
          <div className="flex-1">
            <div className="text-xs text-foreground">
              Civilian Casualties
              {isHistorical && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ua-yellow align-middle" />
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <div>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {currentCasualties.killed.toLocaleString()}+
                </span>
                <span className="text-[9px] text-muted-foreground ml-1">killed</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {currentCasualties.injured.toLocaleString()}+
                </span>
                <span className="text-[9px] text-muted-foreground ml-1">injured</span>
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground/60 mt-0.5">
              Source: OHCHR
              {casualties ? ` (as of ${casualties.cumulativeAsOfDate.slice(0, 7)})` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Humanitarian Funding */}
      <div className={cn(loading && "hidden")}>
        <button
          onClick={() => setExpandedSection(expandedSection === "funding" ? null : "funding")}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-elevated/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TbCoin className="h-3.5 w-3.5 text-ua-yellow" />
            <div className="text-left">
              <div className="text-xs text-foreground">UN Humanitarian Appeals</div>
              <div className="text-[9px] text-muted-foreground">
                {funding
                  ? `${formatUSD(funding.summary.total_funded_usd)} of ${formatUSD(funding.summary.total_required_usd)}`
                  : "Loading..."}
              </div>
              <div className="text-[8px] text-muted-foreground/60">
                UN OCHA Flash &amp; Regional Appeals
              </div>
            </div>
          </div>
          {expandedSection === "funding" ? (
            <TbChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <TbChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
        {expandedSection === "funding" && funding && (
          <div className="px-3 pb-2.5 space-y-2">
            {funding.appeals.map((appeal) => (
              <FundingBar
                key={appeal.name}
                label={`${appeal.year}`}
                funded={appeal.funding_usd}
                required={appeal.requirements_usd}
                pct={appeal.funding_pct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sources */}
      <div className={cn("px-3 py-1.5 border-t border-border/30", loading && "hidden")}>
        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/50">
          <span>Sources:</span>
          <a
            href="https://data.unhcr.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ua-blue transition-colors"
          >
            UNHCR
          </a>
          <span>·</span>
          <a
            href="https://fts.unocha.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ua-blue transition-colors"
          >
            OCHA/FTS
          </a>
          <span>·</span>
          <a
            href="https://www.ohchr.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ua-blue transition-colors"
          >
            OHCHR
          </a>
        </div>
      </div>
    </div>
  );
}
