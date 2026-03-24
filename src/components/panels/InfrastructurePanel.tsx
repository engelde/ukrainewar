"use client";

import { memo, useMemo, useState } from "react";
import {
  TbAnchor,
  TbBuildingBridge,
  TbChevronDown,
  TbChevronUp,
  TbDroplet,
  TbRadioactive,
} from "react-icons/tb";
import { POWER_PLANTS } from "@/data/energy-assets";
import { BRIDGES, DAMS, getStatusAtDate, PORTS } from "@/data/infrastructure";
import { NUCLEAR_PLANTS } from "@/data/nuclear-plants";
import { cn } from "@/lib/utils";

interface InfrastructurePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  timelineDate?: string;
}

const STATUS_DOT: Record<string, string> = {
  operational: "bg-[#48BB78]",
  damaged: "bg-[#ECC94B]",
  destroyed: "bg-[#E53E3E]",
  occupied: "bg-purple-500",
  limited: "bg-[#ECC94B]",
  shutdown: "bg-muted-foreground/40",
  decommissioned: "bg-muted-foreground/40",
};

const STATUS_LABEL: Record<string, string> = {
  operational: "Operational",
  damaged: "Damaged",
  destroyed: "Destroyed",
  occupied: "Occupied",
  limited: "Limited",
  shutdown: "Shutdown",
  decommissioned: "Decommissioned",
};

type CategoryKey = "nuclear" | "dams" | "bridges" | "ports" | "thermal";

interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  nuclear: {
    label: "Nuclear Plants",
    icon: <TbRadioactive className="h-3 w-3 text-[#48BB78]" />,
    color: "text-[#48BB78]",
  },
  thermal: {
    label: "Thermal Power",
    icon: <TbBuildingBridge className="h-3 w-3 text-orange-400" />,
    color: "text-orange-400",
  },
  dams: {
    label: "Dams & Hydro",
    icon: <TbDroplet className="h-3 w-3 text-ua-blue-light" />,
    color: "text-ua-blue-light",
  },
  bridges: {
    label: "Bridges",
    icon: <TbBuildingBridge className="h-3 w-3 text-ua-yellow" />,
    color: "text-ua-yellow",
  },
  ports: {
    label: "Ports",
    icon: <TbAnchor className="h-3 w-3 text-cyan-400" />,
    color: "text-cyan-400",
  },
};

function computeStatus(
  item: { status: string; statusHistory?: { date: string; status: string }[] },
  dateStr: string | undefined,
): string {
  if (!dateStr) return item.status;
  return getStatusAtDate(item, dateStr.replace(/-/g, ""));
}

function InfrastructurePanelInner({ isOpen, onToggle, timelineDate }: InfrastructurePanelProps) {
  const [expandedSection, setExpandedSection] = useState<CategoryKey | null>(null);

  const dateStr = timelineDate ?? undefined;

  const items = useMemo(() => {
    const nuclear = NUCLEAR_PLANTS.map((p) => ({
      id: p.id,
      name: p.name,
      status: computeStatus(p, dateStr),
      detail: `${p.reactors} reactors, ${p.capacityMW} MW`,
    }));
    const thermal = POWER_PLANTS.map((p) => ({
      id: p.id,
      name: p.name,
      status: computeStatus(p, dateStr),
      detail: p.capacityMW ? `${p.capacityMW} MW` : undefined,
    }));
    const dams = DAMS.map((d) => ({
      id: d.id,
      name: d.name,
      status: computeStatus(d, dateStr),
      detail: d.capacityMW ? `${d.capacityMW} MW` : undefined,
    }));
    const bridges = BRIDGES.map((b) => ({
      id: b.id,
      name: b.name,
      status: computeStatus(b, dateStr),
      detail: undefined as string | undefined,
    }));
    const ports = PORTS.map((p) => ({
      id: p.id,
      name: p.name,
      status: computeStatus(p, dateStr),
      detail: p.portType === "river" ? "River" : "Sea",
    }));
    return { nuclear, thermal, dams, bridges, ports };
  }, [dateStr]);

  const summary = useMemo(() => {
    const all = [
      ...items.nuclear,
      ...items.thermal,
      ...items.dams,
      ...items.bridges,
      ...items.ports,
    ];
    return {
      total: all.length,
      operational: all.filter((i) => i.status === "operational").length,
      damaged: all.filter((i) => i.status === "damaged" || i.status === "limited").length,
      destroyed: all.filter((i) => i.status === "destroyed").length,
      occupied: all.filter((i) => i.status === "occupied").length,
    };
  }, [items]);

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
          <TbBuildingBridge className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-indigo-400">
            Infrastructure
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand infrastructure panel"
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
        "w-full max-w-xs rounded-lg border border-border/30 bg-background/95 backdrop-blur-md overflow-hidden max-h-[65vh] overflow-y-auto",
        "shadow-xl shadow-black/30",
        "scrollbar-thin scrollbar-thumb-border/30",
      )}
    >
      {/* Header */}
      <div className="drag-handle sticky top-0 z-10 bg-background/90 backdrop-blur-sm px-3 py-2 border-b border-border/30 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <TbBuildingBridge className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-indigo-400">
            Infrastructure
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close infrastructure panel"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <TbChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Summary row */}
      <div className="px-3 py-2 border-b border-border/20">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-[0.6rem] text-muted-foreground">Operational</div>
            <div className="text-sm font-bold text-[#48BB78]">{summary.operational}</div>
          </div>
          <div>
            <div className="text-[0.6rem] text-muted-foreground">Damaged</div>
            <div className="text-sm font-bold text-[#ECC94B]">{summary.damaged}</div>
          </div>
          <div>
            <div className="text-[0.6rem] text-muted-foreground">Destroyed</div>
            <div className="text-sm font-bold text-[#E53E3E]">{summary.destroyed}</div>
          </div>
          <div>
            <div className="text-[0.6rem] text-muted-foreground">Occupied</div>
            <div className="text-sm font-bold text-purple-500">{summary.occupied}</div>
          </div>
        </div>
      </div>

      {/* Category sections */}
      <div className="px-3 py-1.5 space-y-0.5">
        {(Object.keys(CATEGORIES) as CategoryKey[]).map((catKey) => {
          const cat = CATEGORIES[catKey];
          const catItems = items[catKey];
          const isExpanded = expandedSection === catKey;
          const catOk = catItems.filter((i) => i.status === "operational").length;
          const catTotal = catItems.length;

          return (
            <div key={catKey}>
              <button
                type="button"
                onClick={() => setExpandedSection(isExpanded ? null : catKey)}
                className="w-full flex items-center justify-between py-1.5 group"
              >
                <div className="flex items-center gap-1.5">
                  {cat.icon}
                  <span className={cn("text-[0.625rem] font-medium", cat.color)}>{cat.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.6rem] text-muted-foreground">
                    {catOk}/{catTotal}
                  </span>
                  {isExpanded ? (
                    <TbChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <TbChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="pb-1.5 space-y-0.5">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-0.5 pl-5 pr-1"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full flex-shrink-0",
                            STATUS_DOT[item.status] ?? "bg-muted-foreground/40",
                          )}
                        />
                        <span className="text-[0.6rem] text-foreground/80 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.detail && (
                          <span className="text-[0.55rem] text-muted-foreground">
                            {item.detail}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-[0.55rem] font-medium",
                            item.status === "operational" && "text-[#48BB78]",
                            item.status === "damaged" && "text-[#ECC94B]",
                            item.status === "limited" && "text-[#ECC94B]",
                            item.status === "destroyed" && "text-[#E53E3E]",
                            item.status === "occupied" && "text-purple-500",
                            item.status === "shutdown" && "text-muted-foreground",
                            item.status === "decommissioned" && "text-muted-foreground",
                          )}
                        >
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Source */}
      <div className="px-3 py-1.5 border-t border-border/20">
        <p className="text-[0.5rem] text-muted-foreground/60 text-center">
          Sources: IAEA, Energoatom, OCHA, open-source intelligence
        </p>
      </div>
    </div>
  );
}

const InfrastructurePanel = memo(InfrastructurePanelInner);
export default InfrastructurePanel;
