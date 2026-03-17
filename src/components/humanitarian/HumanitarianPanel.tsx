"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  TbUsers,
  TbHome,
  TbCoin,
  TbChevronDown,
  TbChevronUp,
  TbWorld,
  TbHeartHandshake,
} from "react-icons/tb";

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
            pct >= 75
              ? "bg-capture/60"
              : pct >= 50
                ? "bg-ua-yellow/50"
                : "bg-destruction/50"
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-right">
        <span className="text-[9px] font-mono text-muted-foreground">
          {pct}% funded
        </span>
      </div>
    </div>
  );
}

interface HumanitarianPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function HumanitarianPanel({
  isOpen,
  onToggle,
}: HumanitarianPanelProps) {
  const [refugees, setRefugees] = useState<RefugeeData | null>(null);
  const [funding, setFunding] = useState<FundingData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      try {
        const [refRes, fundRes] = await Promise.all([
          fetch("/api/humanitarian/refugees"),
          fetch("/api/humanitarian/funding"),
        ]);
        if (refRes.ok) setRefugees(await refRes.json());
        if (fundRes.ok) setFunding(await fundRes.json());
      } catch {
        // Data loads silently on error
      }
    }
    fetchData();
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          "fixed right-3 top-1/2 -translate-y-1/2 z-30",
          "flex items-center gap-1.5 px-2 py-3",
          "rounded-lg",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "text-muted-foreground hover:text-foreground",
          "transition-colors",
          "writing-mode-vertical"
        )}
        style={{ writingMode: "vertical-rl" }}
      >
        <TbHeartHandshake className="h-3.5 w-3.5 rotate-90" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          Humanitarian
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-3 top-14 z-30",
        "sm:right-4 sm:top-16",
        "w-64",
        "max-h-[calc(100vh-12rem)]",
        "overflow-y-auto",
        "rounded-lg",
        "bg-background/85 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30"
      )}
    >
      {/* Header */}
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm px-3 py-2 border-b border-border/30 flex items-center justify-between">
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
          <TbChevronDown className="h-3.5 w-3.5 rotate-90" />
        </button>
      </div>

      {/* Refugees Section */}
      <div className="border-b border-border/20">
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === "refugees" ? null : "refugees"
            )
          }
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-elevated/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TbWorld className="h-3.5 w-3.5 text-ua-blue" />
            <div className="text-left">
              <div className="text-xs text-foreground">Refugees Abroad</div>
              <div className="text-sm font-semibold text-foreground font-mono">
                {refugees
                  ? formatNumber(refugees.summary.total_refugees)
                  : "..."}
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
                  .replace(
                    "United Kingdom of Great Britain and Northern Ireland",
                    "UK"
                  )
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
      <div className="border-b border-border/20">
        <button
          onClick={() =>
            setExpandedSection(expandedSection === "idps" ? null : "idps")
          }
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-elevated/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TbHome className="h-3.5 w-3.5 text-damage" />
            <div className="text-left">
              <div className="text-xs text-foreground">
                Internally Displaced
              </div>
              <div className="text-sm font-semibold text-foreground font-mono">
                {refugees
                  ? formatNumber(refugees.summary.total_idps)
                  : "..."}
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
                .map(
                  (y: {
                    year: number;
                    idps: number;
                    returned_idps: number;
                  }) => (
                    <div
                      key={y.year}
                      className="bg-surface-elevated/30 rounded px-2 py-1.5"
                    >
                      <div className="text-[9px] text-muted-foreground">
                        {y.year}
                      </div>
                      <div className="text-[11px] font-mono text-foreground">
                        {formatNumber(y.idps)}
                      </div>
                      {y.returned_idps > 0 && (
                        <div className="text-[8px] text-capture">
                          ↩ {formatNumber(y.returned_idps)} returned
                        </div>
                      )}
                    </div>
                  )
                )}
            </div>
          </div>
        )}
      </div>

      {/* Civilian Casualties placeholder */}
      <div className="border-b border-border/20">
        <div className="flex items-center gap-2 px-3 py-2">
          <TbUsers className="h-3.5 w-3.5 text-destruction" />
          <div>
            <div className="text-xs text-foreground">Civilian Casualties</div>
            <div className="text-[9px] text-muted-foreground">
              11,743+ killed · 25,970+ injured
            </div>
            <div className="text-[8px] text-muted-foreground/60">
              Source: OHCHR (as of Dec 2024)
            </div>
          </div>
        </div>
      </div>

      {/* Humanitarian Funding */}
      <div>
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === "funding" ? null : "funding"
            )
          }
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-elevated/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TbCoin className="h-3.5 w-3.5 text-ua-yellow" />
            <div className="text-left">
              <div className="text-xs text-foreground">
                Humanitarian Funding
              </div>
              <div className="text-[9px] text-muted-foreground">
                {funding
                  ? `${formatUSD(funding.summary.total_funded_usd)} of ${formatUSD(funding.summary.total_required_usd)}`
                  : "Loading..."}
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
      <div className="px-3 py-1.5 border-t border-border/30">
        <div className="text-[8px] text-muted-foreground/60">
          Sources: UNHCR · OCHA/FTS · OHCHR
        </div>
      </div>
    </div>
  );
}
