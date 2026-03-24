"use client";

import { useEffect, useRef, useState } from "react";
import {
  TbBrandGithub,
  TbDatabase,
  TbExternalLink,
  TbInfoCircle,
  TbMap2,
  TbX,
} from "react-icons/tb";
import { t } from "@/i18n";
import { DATA_SOURCES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavItem = "about" | "legend" | "sources" | null;

// ── Legend data ────────────────────────────────────────────────────────────

interface LegendItem {
  label: string;
  color: string;
  type: "fill" | "line" | "dashed" | "circle" | "icon";
  secondary?: string;
}

const TERRITORY_ITEMS: LegendItem[] = [
  { label: "Russian-occupied", color: "#c53030", type: "fill" },
  { label: "Contested", color: "#eab308", type: "fill" },
  { label: "Frontline", color: "#ff4444", type: "dashed" },
];

const CONFLICT_ITEMS: LegendItem[] = [
  { label: "Battles / Explosions", color: "#ef4444", type: "circle" },
  { label: "Armed clashes", color: "#f97316", type: "circle" },
  { label: "Shelling / Missile strikes", color: "#a855f7", type: "circle" },
  { label: "Air/Drone strikes", color: "#3b82f6", type: "circle" },
];

const INFRASTRUCTURE_ITEMS: LegendItem[] = [
  { label: "Nuclear plants", color: "#facc15", type: "icon", secondary: "☢" },
  { label: "Dams", color: "#38bdf8", type: "icon", secondary: "⌇" },
  { label: "Gas pipelines", color: "#94a3b8", type: "line" },
  { label: "Bases (Ukraine)", color: "#005BBB", type: "circle" },
  { label: "Bases (Russia)", color: "#C53030", type: "circle" },
  { label: "Bases (NATO)", color: "#1b69a1", type: "circle" },
  { label: "Bases (Belarus)", color: "#8b1a1a", type: "circle" },
];

const OVERLAY_ITEMS: LegendItem[] = [
  { label: "Conflict heatmap", color: "#ef4444", type: "fill", secondary: "gradient" },
  { label: "Thermal anomalies", color: "#ff6b00", type: "circle" },
  { label: "Equipment losses", color: "#a855f7", type: "circle" },
];

function LegendSwatch({ item }: { item: LegendItem }) {
  if (item.type === "fill") {
    return (
      <span
        className="inline-block h-3 w-4 rounded-sm border border-white/10"
        style={{
          backgroundColor: item.color,
          opacity: item.secondary === "gradient" ? 0.5 : 0.35,
        }}
      />
    );
  }
  if (item.type === "line") {
    return (
      <span className="inline-flex h-3 w-4 items-center">
        <span className="h-[2px] w-full rounded-full" style={{ backgroundColor: item.color }} />
      </span>
    );
  }
  if (item.type === "dashed") {
    return (
      <span className="inline-flex h-3 w-4 items-center">
        <span
          className="h-[2px] w-full"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${item.color} 0px, ${item.color} 4px, transparent 4px, transparent 7px)`,
          }}
        />
      </span>
    );
  }
  if (item.type === "circle") {
    return (
      <span className="inline-flex h-3 w-4 items-center justify-center">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color, opacity: 0.8 }}
        />
      </span>
    );
  }
  if (item.type === "icon") {
    return (
      <span
        className="inline-flex h-3 w-4 items-center justify-center text-[0.625rem]"
        style={{ color: item.color }}
      >
        {item.secondary}
      </span>
    );
  }
  return null;
}

function LegendSection({ title, items }: { title: string; items: LegendItem[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[0.5625rem] font-bold uppercase tracking-widest text-muted-foreground/70">
        {title}
      </h4>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <LegendSwatch item={item} />
            <span className="text-[0.625rem] text-foreground/70">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface NavMenuProps {
  mobile?: boolean;
  onClose?: () => void;
}

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const [active, setActive] = useState<NavItem>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
        onClick={() => setActive(active === "about" ? null : "about")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[0.625rem] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "about"
            ? "text-ua-blue"
            : "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbInfoCircle className="h-3 w-3" />
        <span className="hidden lg:inline">About</span>
      </button>
      <button
        onClick={() => setActive(active === "legend" ? null : "legend")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[0.625rem] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "legend"
            ? "text-ua-blue"
            : "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbMap2 className="h-3 w-3" />
        <span className="hidden lg:inline">Legend</span>
      </button>
      <button
        onClick={() => setActive(active === "sources" ? null : "sources")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[0.625rem] font-semibold uppercase tracking-wider",
          "transition-colors",
          active === "sources"
            ? "text-ua-blue"
            : "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbDatabase className="h-3 w-3" />
        <span className="hidden lg:inline">Sources</span>
      </button>
      <a
        href="https://github.com/engelde/ukrainewar"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1",
          "text-[0.625rem] font-semibold uppercase tracking-wider",
          "transition-colors",
          "text-muted-foreground/70 hover:text-muted-foreground",
        )}
      >
        <TbBrandGithub className="h-3 w-3" />
        <span className="hidden lg:inline">GitHub</span>
      </a>

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
            <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-ua-blue">
              {active === "about" ? "About" : active === "legend" ? "Map Legend" : "Data Sources"}
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
                <p className="text-[0.6875rem] text-foreground/80 leading-relaxed">
                  An independent research project visualizing the Russo-Ukrainian War through
                  territory control, military losses, humanitarian impact, and international aid
                  from February 2022 to the present.
                </p>
                <p className="text-[0.625rem] text-muted-foreground leading-relaxed">
                  This project is not affiliated with any government, military, or news
                  organization. All data is sourced from publicly available APIs and datasets.
                  Navigate the timeline to explore the war&apos;s progression. Toggle map layers and
                  panels to customize your view.
                </p>
                <div className="mt-3 rounded-md border border-ua-blue/30 bg-ua-blue/5 px-2.5 py-2">
                  <p className="text-[0.6875rem] text-ua-blue font-medium leading-relaxed">
                    Stand with Ukraine
                  </p>
                  <p className="text-[0.625rem] text-foreground/70 leading-relaxed mt-1">
                    The people of Ukraine continue to defend their homeland, their freedom, and
                    their future. Support their resilience and recovery.
                  </p>
                  <a
                    href="https://u24.gov.ua"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 rounded bg-ua-blue/15 px-2 py-0.5 text-[0.625rem] font-medium text-ua-blue hover:bg-ua-blue/25 transition-colors"
                  >
                    Donate via UNITED24
                    <TbExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {active === "legend" && (
              <div className="space-y-2.5">
                <LegendSection title="Territory" items={TERRITORY_ITEMS} />
                <LegendSection title="Conflicts" items={CONFLICT_ITEMS} />
                <LegendSection title="Infrastructure" items={INFRASTRUCTURE_ITEMS} />
                <LegendSection title="Overlays" items={OVERLAY_ITEMS} />
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
                      <div className="text-[0.625rem] font-medium text-foreground/80 group-hover:text-ua-blue transition-colors">
                        {source.name}
                      </div>
                      <div className="text-[0.5625rem] text-muted-foreground/60">
                        {source.description}
                      </div>
                    </div>
                    <TbExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-ua-blue transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileSidebar({ onClose }: { onClose: () => void }) {
  const sidebarRef = useRef<HTMLDivElement>(null);

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
          <SidebarSection title="About">
            <div className="space-y-2 px-4 pb-3">
              <p className="text-[0.6875rem] text-foreground/80 leading-relaxed">
                An interactive tracker for the Russo-Ukrainian War, visualizing territory control,
                military losses, humanitarian impact, and international aid from February 2022 to
                the present.
              </p>
              <p className="text-[0.625rem] text-muted-foreground leading-relaxed">
                Navigate the timeline to explore the war&apos;s progression. Toggle map layers to
                view territory, equipment losses, battles, and conflict events. All data updates
                daily from official sources.
              </p>
              <div className="mt-2 rounded-md border border-ua-blue/30 bg-ua-blue/5 px-2.5 py-2">
                <p className="text-[0.6875rem] text-ua-blue font-medium leading-relaxed">
                  Stand with Ukraine
                </p>
                <p className="text-[0.625rem] text-foreground/70 leading-relaxed mt-1">
                  The people of Ukraine continue to defend their homeland, their freedom, and their
                  future. Support their resilience and recovery.
                </p>
                <a
                  href="https://u24.gov.ua"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 rounded bg-ua-blue/15 px-2 py-0.5 text-[0.625rem] font-medium text-ua-blue hover:bg-ua-blue/25 transition-colors"
                >
                  Donate via UNITED24
                  <TbExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="Map Legend" icon="legend">
            <div className="space-y-2.5 px-4 pb-3">
              <LegendSection title="Territory" items={TERRITORY_ITEMS} />
              <LegendSection title="Conflicts" items={CONFLICT_ITEMS} />
              <LegendSection title="Infrastructure" items={INFRASTRUCTURE_ITEMS} />
              <LegendSection title="Overlays" items={OVERLAY_ITEMS} />
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
                    <div className="text-[0.625rem] font-medium text-foreground/80 group-hover:text-ua-blue transition-colors">
                      {source.name}
                    </div>
                    <div className="text-[0.5625rem] text-muted-foreground/60">
                      {source.description}
                    </div>
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
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-muted-foreground/70 hover:text-foreground hover:bg-surface-elevated/30 transition-colors"
      >
        {icon === "legend" ? (
          <TbMap2 className="h-4 w-4" />
        ) : title === "About" ? (
          <TbInfoCircle className="h-4 w-4" />
        ) : (
          <TbDatabase className="h-4 w-4" />
        )}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </button>
      {open && children}
    </div>
  );
}

export default function NavMenu({ mobile, onClose }: NavMenuProps) {
  if (mobile && onClose) {
    return <MobileSidebar onClose={onClose} />;
  }
  return <NavContent />;
}
