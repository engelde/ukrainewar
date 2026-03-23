"use client";

import { useEffect, useRef, useState } from "react";
import {
  TbBolt,
  TbBrandGithub,
  TbCoin,
  TbDatabase,
  TbExternalLink,
  TbFlag,
  TbGlobe,
  TbHeartHandshake,
  TbInfoCircle,
  TbLayoutGrid,
  TbMinus,
  TbPlus,
  TbScale,
  TbShieldCheck,
  TbSkull,
  TbStack,
  TbTextSize,
  TbUserMinus,
  TbX,
} from "react-icons/tb";
import { useFontSize } from "@/hooks/useFontSize";
import { t } from "@/i18n";
import { DATA_SOURCES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavItem = "about" | "sources" | "panels" | null;

interface PanelToggles {
  events?: () => void;
  russianLosses?: () => void;
  layers?: () => void;
  humanitarian?: () => void;
  spending?: () => void;
  energy?: () => void;
  airDefense?: () => void;
  support?: () => void;
  ukraineLosses?: () => void;
  sanctions?: () => void;
}

interface PanelStates {
  events?: boolean;
  russianLosses?: boolean;
  layers?: boolean;
  humanitarian?: boolean;
  spending?: boolean;
  energy?: boolean;
  airDefense?: boolean;
  support?: boolean;
  ukraineLosses?: boolean;
  sanctions?: boolean;
}

interface NavMenuProps {
  mobile?: boolean;
  onClose?: () => void;
  eventsOpen?: boolean;
  onToggleEvents?: () => void;
  panelToggles?: PanelToggles;
  panelStates?: PanelStates;
}

function PanelToggle({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
        "text-[10px] font-semibold uppercase tracking-wider",
        active
          ? "text-ua-blue bg-ua-blue/10"
          : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-elevated/50",
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </button>
  );
}

function NavContent({
  onItemClick,
  eventsOpen,
  onToggleEvents,
  panelToggles,
  panelStates,
}: {
  onItemClick?: () => void;
  eventsOpen?: boolean;
  onToggleEvents?: () => void;
  panelToggles?: PanelToggles;
  panelStates?: PanelStates;
}) {
  const [active, setActive] = useState<NavItem>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { fontSize, increase, decrease, reset, canIncrease, canDecrease, isDefault } =
    useFontSize();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };
    if (active) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [active]);

  return (
    <div ref={menuRef} className="relative flex items-center gap-0.5">
      <button
        onClick={() => setActive(active === "panels" ? null : "panels")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[10px] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "panels"
            ? "text-ua-blue"
            : "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbLayoutGrid className="h-3 w-3" />
        <span>Panels</span>
      </button>
      <button
        onClick={() => setActive(active === "about" ? null : "about")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[10px] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "about"
            ? "text-ua-blue"
            : "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbInfoCircle className="h-3 w-3" />
        <span>About</span>
      </button>
      <button
        onClick={() => setActive(active === "sources" ? null : "sources")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[10px] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "sources"
            ? "text-ua-blue"
            : "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbDatabase className="h-3 w-3" />
        <span>Sources</span>
      </button>
      <a
        href="https://github.com/engelde/ukrainewar"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[10px] font-semibold uppercase tracking-wider",
          "transition-colors",
          "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbBrandGithub className="h-3 w-3" />
        <span>GitHub</span>
      </a>

      {/* Font size controls */}
      <div className="flex items-center gap-0 ml-1 border-l border-border/30 pl-1.5">
        <button
          onClick={decrease}
          disabled={!canDecrease}
          aria-label="Decrease font size"
          className={cn(
            "rounded-md p-1 transition-colors",
            canDecrease
              ? "text-muted-foreground/70 hover:text-muted-foreground"
              : "text-muted-foreground/30 cursor-not-allowed",
          )}
        >
          <TbMinus className="h-3 w-3" />
        </button>
        <button
          onClick={reset}
          disabled={isDefault}
          aria-label="Reset font size"
          title={`${fontSize}px`}
          className={cn(
            "rounded-md px-0.5 py-1 transition-colors",
            !isDefault ? "text-ua-blue hover:text-ua-blue-light" : "text-muted-foreground/50",
          )}
        >
          <TbTextSize className="h-3 w-3" />
        </button>
        <button
          onClick={increase}
          disabled={!canIncrease}
          aria-label="Increase font size"
          className={cn(
            "rounded-md p-1 transition-colors",
            canIncrease
              ? "text-muted-foreground/70 hover:text-muted-foreground"
              : "text-muted-foreground/30 cursor-not-allowed",
          )}
        >
          <TbPlus className="h-3 w-3" />
        </button>
      </div>

      {/* Dropdown panels */}
      {active && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1.5 z-50",
            "rounded-lg",
            "bg-background/95 backdrop-blur-xl",
            "border border-border/50",
            "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
            "min-w-[240px] sm:min-w-[280px]",
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ua-blue">
              {active === "about" ? "About" : active === "sources" ? "Data Sources" : "Panels"}
            </span>
            <button
              onClick={() => {
                setActive(null);
                onItemClick?.();
              }}
              aria-label="Close dropdown"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <TbX className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-3 py-2.5">
            {active === "about" && (
              <div className="space-y-2">
                <p className="text-[11px] text-foreground/80 leading-relaxed">
                  An interactive tracker for the Russo-Ukrainian War, visualizing territory control,
                  military losses, humanitarian impact, and international aid from February 2022 to
                  the present.
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Navigate the timeline to explore the war&apos;s progression. Toggle map layers to
                  view territory, equipment losses, battles, and conflict events. All data updates
                  daily from official sources.
                </p>
                <div className="mt-3 rounded-md border border-ua-blue/30 bg-ua-blue/5 px-2.5 py-2">
                  <p className="text-[11px] text-ua-blue font-medium leading-relaxed">
                    Stand with Ukraine
                  </p>
                  <p className="text-[10px] text-foreground/70 leading-relaxed mt-1">
                    The people of Ukraine continue to defend their homeland, their freedom, and
                    their future. Support their resilience and recovery.
                  </p>
                  <a
                    href="https://u24.gov.ua"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 rounded bg-ua-blue/15 px-2 py-0.5 text-[10px] font-medium text-ua-blue hover:bg-ua-blue/25 transition-colors"
                  >
                    Donate via UNITED24
                    <TbExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {active === "sources" && (
              <div className="flex flex-col gap-1">
                {DATA_SOURCES.map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded px-1.5 py-1 -mx-1.5 hover:bg-surface-elevated/50 transition-colors group"
                  >
                    <div>
                      <div className="text-[10px] font-medium text-foreground/80 group-hover:text-ua-blue transition-colors">
                        {source.name}
                      </div>
                      <div className="text-[9px] text-muted-foreground/60">
                        {source.description}
                      </div>
                    </div>
                    <TbExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-ua-blue transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}

            {active === "panels" && (
              <div className="grid grid-cols-2 gap-1">
                <PanelToggle
                  label="Events"
                  icon={TbFlag}
                  active={panelStates?.events}
                  onClick={panelToggles?.events}
                />
                <PanelToggle
                  label="Russian Losses"
                  icon={TbSkull}
                  active={panelStates?.russianLosses}
                  onClick={panelToggles?.russianLosses}
                />
                <PanelToggle
                  label="Layers"
                  icon={TbStack}
                  active={panelStates?.layers}
                  onClick={panelToggles?.layers}
                />
                <PanelToggle
                  label="Humanitarian"
                  icon={TbHeartHandshake}
                  active={panelStates?.humanitarian}
                  onClick={panelToggles?.humanitarian}
                />
                <PanelToggle
                  label="Spending & Aid"
                  icon={TbCoin}
                  active={panelStates?.spending}
                  onClick={panelToggles?.spending}
                />
                <PanelToggle
                  label="Energy"
                  icon={TbBolt}
                  active={panelStates?.energy}
                  onClick={panelToggles?.energy}
                />
                <PanelToggle
                  label="Air Defense"
                  icon={TbShieldCheck}
                  active={panelStates?.airDefense}
                  onClick={panelToggles?.airDefense}
                />
                <PanelToggle
                  label="Intl Support"
                  icon={TbGlobe}
                  active={panelStates?.support}
                  onClick={panelToggles?.support}
                />
                <PanelToggle
                  label="UA Losses"
                  icon={TbUserMinus}
                  active={panelStates?.ukraineLosses}
                  onClick={panelToggles?.ukraineLosses}
                />
                <PanelToggle
                  label="Sanctions"
                  icon={TbScale}
                  active={panelStates?.sanctions}
                  onClick={panelToggles?.sanctions}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileSidebar({
  onClose,
  eventsOpen,
  onToggleEvents,
  panelToggles,
  panelStates,
}: {
  onClose: () => void;
  eventsOpen?: boolean;
  onToggleEvents?: () => void;
  panelToggles?: PanelToggles;
  panelStates?: PanelStates;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { fontSize, increase, decrease, reset, canIncrease, canDecrease, isDefault } =
    useFontSize();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={sidebarRef}
        className={cn(
          "absolute left-0 top-0 bottom-0 w-64",
          "bg-background/95 backdrop-blur-xl",
          "border-r border-border/50",
          "shadow-[4px_0_20px_rgba(0,0,0,0.4)]",
          "animate-in slide-in-from-left duration-200",
          "flex flex-col",
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-1 flex-col overflow-hidden rounded-full">
              <div className="h-1/2 bg-ua-blue" />
              <div className="h-1/2 bg-ua-yellow" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              {t("header.title")}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <TbX className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar nav */}
        <div className="flex flex-col py-2">
          <SidebarSection title="Panels">
            <div className="flex flex-col gap-0.5 px-2 pb-3">
              {(
                [
                  { label: "Events", icon: TbFlag, key: "events" as const },
                  { label: "Russian Losses", icon: TbSkull, key: "russianLosses" as const },
                  { label: "Layers", icon: TbStack, key: "layers" as const },
                  { label: "Humanitarian", icon: TbHeartHandshake, key: "humanitarian" as const },
                  { label: "Spending & Aid", icon: TbCoin, key: "spending" as const },
                  { label: "Energy", icon: TbBolt, key: "energy" as const },
                  { label: "Air Defense", icon: TbShieldCheck, key: "airDefense" as const },
                  { label: "Intl Support", icon: TbGlobe, key: "support" as const },
                  { label: "UA Losses", icon: TbUserMinus, key: "ukraineLosses" as const },
                  { label: "Sanctions", icon: TbScale, key: "sanctions" as const },
                ] as const
              ).map(({ label, icon: Icon, key }) => (
                <button
                  key={key}
                  onClick={() => {
                    panelToggles?.[key]?.();
                    onClose();
                  }}
                  aria-label={`Toggle ${label} panel`}
                  className={cn(
                    "flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors",
                    panelStates?.[key]
                      ? "text-ua-blue bg-ua-blue/10"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-surface-elevated/30",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
                </button>
              ))}
            </div>
          </SidebarSection>
          <SidebarSection title="About">
            <div className="space-y-2 px-4 pb-3">
              <p className="text-[11px] text-foreground/80 leading-relaxed">
                An interactive tracker for the Russo-Ukrainian War, visualizing territory control,
                military losses, humanitarian impact, and international aid from February 2022 to
                the present.
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Navigate the timeline to explore the war&apos;s progression. Toggle map layers to
                view territory, equipment losses, battles, and conflict events. All data updates
                daily from official sources.
              </p>
              <div className="mt-2 rounded-md border border-ua-blue/30 bg-ua-blue/5 px-2.5 py-2">
                <p className="text-[11px] text-ua-blue font-medium leading-relaxed">
                  Stand with Ukraine
                </p>
                <p className="text-[10px] text-foreground/70 leading-relaxed mt-1">
                  The people of Ukraine continue to defend their homeland, their freedom, and their
                  future. Support their resilience and recovery.
                </p>
                <a
                  href="https://u24.gov.ua"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 rounded bg-ua-blue/15 px-2 py-0.5 text-[10px] font-medium text-ua-blue hover:bg-ua-blue/25 transition-colors"
                >
                  Donate via UNITED24
                  <TbExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="Data Sources">
            <div className="flex flex-col gap-0.5 px-2 pb-3">
              {DATA_SOURCES.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-elevated/50 transition-colors group"
                >
                  <div>
                    <div className="text-[10px] font-medium text-foreground/80 group-hover:text-ua-blue transition-colors">
                      {source.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground/60">{source.description}</div>
                  </div>
                  <TbExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-ua-blue transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </SidebarSection>

          <a
            href="https://github.com/engelde/ukrainewar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground/70 hover:text-foreground hover:bg-surface-elevated/30 transition-colors"
          >
            <TbBrandGithub className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">GitHub</span>
          </a>

          {/* Font size control */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/20">
            <TbTextSize className="h-4 w-4 text-muted-foreground/70" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Text
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={decrease}
                disabled={!canDecrease}
                aria-label="Decrease font size"
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  canDecrease
                    ? "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/30"
                    : "text-muted-foreground/30 cursor-not-allowed",
                )}
              >
                <TbMinus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={reset}
                disabled={isDefault}
                aria-label="Reset font size"
                className={cn(
                  "text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors min-w-[32px] text-center",
                  !isDefault ? "text-ua-blue hover:bg-ua-blue/10" : "text-muted-foreground/50",
                )}
              >
                {fontSize}px
              </button>
              <button
                onClick={increase}
                disabled={!canIncrease}
                aria-label="Increase font size"
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  canIncrease
                    ? "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/30"
                    : "text-muted-foreground/30 cursor-not-allowed",
                )}
              >
                <TbPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-muted-foreground/70 hover:text-foreground hover:bg-surface-elevated/30 transition-colors"
      >
        {title === "About" ? (
          <TbInfoCircle className="h-4 w-4" />
        ) : title === "Panels" ? (
          <TbLayoutGrid className="h-4 w-4" />
        ) : (
          <TbDatabase className="h-4 w-4" />
        )}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </button>
      {open && children}
    </div>
  );
}

export default function NavMenu({
  mobile,
  onClose,
  eventsOpen,
  onToggleEvents,
  panelToggles,
  panelStates,
}: NavMenuProps) {
  if (mobile && onClose) {
    return (
      <MobileSidebar
        onClose={onClose}
        eventsOpen={eventsOpen}
        onToggleEvents={onToggleEvents}
        panelToggles={panelToggles}
        panelStates={panelStates}
      />
    );
  }
  return (
    <NavContent
      eventsOpen={eventsOpen}
      onToggleEvents={onToggleEvents}
      panelToggles={panelToggles}
      panelStates={panelStates}
    />
  );
}
