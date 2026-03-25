import type maplibregl from "maplibre-gl";

export const STATUS_COLORS: Record<string, string> = {
  destroyed: "#e53e3e",
  damaged: "#ed8936",
  captured: "#48bb78",
  abandoned: "#9f7aea",
};

export function normalizeEquipmentCategory(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("tank")) return "tank";
  if (t.includes("ifv") || t.includes("apc") || t.includes("mrap") || t.includes("imv"))
    return "ifv";
  if (t.includes("artillery") || t.includes("howitzer") || t.includes("mortar")) return "artillery";
  if (t.includes("mlrs") || t.includes("rocket")) return "mlrs";
  if (t.includes("uav") || t.includes("drone") || t.includes("uas")) return "uav";
  if (t.includes("air defense") || t.includes("anti-air") || t.includes("sam")) return "aa";
  if (t.includes("jet") || t.includes("aircraft") || t.includes("fighter") || t.includes("bomber"))
    return "jet";
  if (t.includes("helicopter") || t.includes("heli")) return "heli";
  if (t.includes("ship") || t.includes("boat") || t.includes("vessel")) return "ship";
  if (
    t.includes("truck") ||
    t.includes("vehicle") ||
    t.includes("car") ||
    t.includes("engineering") ||
    t.includes("logistics")
  )
    return "vehicle";
  return "other";
}

const CATEGORY_SYMBOLS: Record<string, string> = {
  tank: "T",
  ifv: "I",
  artillery: "A",
  mlrs: "R",
  uav: "D",
  aa: "S",
  jet: "J",
  heli: "H",
  ship: "N",
  vehicle: "V",
  other: "•",
};

export function createEquipmentIcon(
  symbol: string,
  statusColor: string,
  size: number,
): { width: number; height: number; data: Uint8ClampedArray } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Outer dark border
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();

  // Inner colored circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = statusColor;
  ctx.fill();

  // Category letter
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.round(size * 0.42)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, size / 2, size / 2 + 1);

  const imgData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: imgData.data };
}

export function loadEquipmentIcons(mapInstance: maplibregl.Map) {
  const statuses = Object.entries(STATUS_COLORS);
  const categories = Object.entries(CATEGORY_SYMBOLS);
  for (const [status, color] of statuses) {
    for (const [cat, symbol] of categories) {
      const id = `equip-${cat}-${status}`;
      if (!mapInstance.hasImage(id)) {
        mapInstance.addImage(id, createEquipmentIcon(symbol, color, 24));
      }
    }
  }
}

// ── Infrastructure & Base Icon Drawing ──

export type InfraCategory =
  | "nuclear"
  | "dam"
  | "bridge"
  | "port"
  | "power-plant"
  | "gas-station"
  | "nato-base"
  | "belarus-base"
  | "ukraine-base"
  | "russia-base"
  | "conflict-battle"
  | "conflict-explosion"
  | "conflict-protest"
  | "conflict-civilian"
  | "conflict-strategic"
  | "conflict-riot"
  | "battle-major";

function drawNuclearSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  const bladeR = r * 0.85;
  const innerR = r * 0.22;
  const gapAngle = Math.PI / 12;
  for (let i = 0; i < 3; i++) {
    const baseAngle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, bladeR, baseAngle + gapAngle, baseAngle + (2 * Math.PI) / 3 - gapAngle);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.arc(cx, cy, innerR * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWaveSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const amp = r * 0.35;
  const waveW = r * 1.6;
  const startX = cx - waveW / 2;
  for (let row = -1; row <= 1; row++) {
    const yOff = cy + row * amp * 1.1;
    ctx.beginPath();
    ctx.moveTo(startX, yOff);
    for (let x = 0; x <= waveW; x += 1) {
      const t = x / waveW;
      ctx.lineTo(startX + x, yOff + Math.sin(t * Math.PI * 3) * amp * 0.4);
    }
    ctx.lineWidth = r * 0.2;
    ctx.stroke();
  }
}

function drawBridgeSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const w = r * 1.4;
  const h = r * 0.9;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy + h * 0.3);
  ctx.quadraticCurveTo(cx, cy - h * 0.8, cx + w / 2, cy + h * 0.3);
  ctx.lineWidth = r * 0.22;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy + h * 0.3);
  ctx.lineTo(cx + w / 2, cy + h * 0.3);
  ctx.lineWidth = r * 0.18;
  ctx.stroke();
  // pillars
  ctx.lineWidth = r * 0.14;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.25, cy - h * 0.05);
  ctx.lineTo(cx - w * 0.25, cy + h * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.25, cy - h * 0.05);
  ctx.lineTo(cx + w * 0.25, cy + h * 0.3);
  ctx.stroke();
}

function drawAnchorSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const topR = r * 0.22;
  ctx.lineWidth = r * 0.18;
  // ring at top
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.5, topR, 0, Math.PI * 2);
  ctx.stroke();
  // vertical shaft
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.5 + topR);
  ctx.lineTo(cx, cy + r * 0.55);
  ctx.stroke();
  // horizontal crossbar
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.4, cy - r * 0.08);
  ctx.lineTo(cx + r * 0.4, cy - r * 0.08);
  ctx.stroke();
  // curved arms
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.65, cy + r * 0.15);
  ctx.quadraticCurveTo(cx - r * 0.6, cy + r * 0.6, cx, cy + r * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.65, cy + r * 0.15);
  ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.6, cx, cy + r * 0.55);
  ctx.stroke();
}

function drawLightningSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.05, cy - r * 0.8);
  ctx.lineTo(cx - r * 0.3, cy + r * 0.05);
  ctx.lineTo(cx + r * 0.05, cy - r * 0.05);
  ctx.lineTo(cx - r * 0.05, cy + r * 0.8);
  ctx.lineTo(cx + r * 0.3, cy - r * 0.05);
  ctx.lineTo(cx - r * 0.05, cy + r * 0.05);
  ctx.closePath();
  ctx.fill();
}

function drawFlameSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 0.6, cy + r * 0.3, cx - r * 0.55, cy - r * 0.3, cx, cy - r * 0.8);
  ctx.bezierCurveTo(cx + r * 0.55, cy - r * 0.3, cx + r * 0.6, cy + r * 0.3, cx, cy + r * 0.7);
  ctx.fill();
  // inner lighter flame
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.5);
  ctx.bezierCurveTo(cx - r * 0.25, cy + r * 0.2, cx - r * 0.25, cy - r * 0.1, cx, cy - r * 0.35);
  ctx.bezierCurveTo(cx + r * 0.25, cy - r * 0.1, cx + r * 0.25, cy + r * 0.2, cx, cy + r * 0.5);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
}

function drawNATOStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const outerR = r * 0.85;
  const innerR = r * 0.3;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 - Math.PI / 2;
    const midAngle = angle + Math.PI / 4;
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.lineTo(cx + Math.cos(midAngle) * innerR, cy + Math.sin(midAngle) * innerR);
  }
  ctx.closePath();
  ctx.fill();
}

function drawMilitaryStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const outerR = r * 0.85;
  const innerR = r * 0.35;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(outerAngle) * outerR, cy + Math.sin(outerAngle) * outerR);
    ctx.lineTo(cx + Math.cos(innerAngle) * innerR, cy + Math.sin(innerAngle) * innerR);
  }
  ctx.closePath();
  ctx.fill();
}

// ── Conflict & Battle Icon Drawing ──

function drawConflictBattleSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const s = r * 0.7;
  ctx.lineWidth = r * 0.18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s);
  ctx.lineTo(cx + s, cy + s);
  ctx.moveTo(cx + s, cy - s);
  ctx.lineTo(cx - s, cy + s);
  ctx.stroke();
}

function drawConflictExplosionSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const points = 6;
  const outerR = r * 0.8;
  const innerR = r * 0.35;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawConflictProtestSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const s = r * 0.6;
  ctx.lineWidth = r * 0.15;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.8);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.8);
  ctx.lineTo(cx - s, cy + s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.2);
  ctx.lineTo(cx - s * 1.3, cy);
  ctx.lineTo(cx - s, cy + s * 0.2);
  ctx.stroke();
}

function drawConflictCivilianSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const s = r * 0.6;
  ctx.lineWidth = r * 0.15;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.6, s * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.3);
  ctx.lineTo(cx, cy + s * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.4, cy);
  ctx.lineTo(cx + s * 0.4, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.3);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.8);
  ctx.moveTo(cx, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.8);
  ctx.stroke();
}

function drawConflictStrategicSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const s = r * 0.7;
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy + s);
  ctx.lineTo(cx - s * 0.3, cy - s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy - s);
  ctx.lineTo(cx + s * 0.6, cy - s * 0.5);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.1);
  ctx.closePath();
  ctx.fill();
}

function drawConflictRiotSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 0.7;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s);
  ctx.bezierCurveTo(cx - s * 0.8, cy + s * 0.2, cx - s * 0.6, cy - s * 0.5, cx, cy - s);
  ctx.bezierCurveTo(cx + s * 0.6, cy - s * 0.5, cx + s * 0.8, cy + s * 0.2, cx, cy + s);
  ctx.closePath();
  ctx.fill();
}

function drawBattleMajorSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const points = 5;
  const outerR = r * 0.8;
  const innerR = r * 0.35;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawShieldSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const w = r * 0.75;
  const h = r * 1.0;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + w, cy - h * 0.5);
  ctx.lineTo(cx + w, cy + h * 0.1);
  ctx.quadraticCurveTo(cx, cy + h, cx, cy + h);
  ctx.quadraticCurveTo(cx, cy + h, cx - w, cy + h * 0.1);
  ctx.lineTo(cx - w, cy - h * 0.5);
  ctx.closePath();
  ctx.fill();
}

export function createMapIcon(
  category: InfraCategory,
  color: string,
  size: number,
): { width: number; height: number; data: Uint8ClampedArray } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const symbolR = size * 0.3;

  // Dark background circle
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fill();

  // Inner colored circle
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // White symbol on top
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";

  switch (category) {
    case "nuclear":
      drawNuclearSymbol(ctx, cx, cy, symbolR);
      break;
    case "dam":
      drawWaveSymbol(ctx, cx, cy, symbolR);
      break;
    case "bridge":
      drawBridgeSymbol(ctx, cx, cy, symbolR);
      break;
    case "port":
      drawAnchorSymbol(ctx, cx, cy, symbolR);
      break;
    case "power-plant":
      drawLightningSymbol(ctx, cx, cy, symbolR);
      break;
    case "gas-station":
      drawFlameSymbol(ctx, cx, cy, symbolR);
      break;
    case "nato-base":
      drawMilitaryStar(ctx, cx, cy, symbolR);
      break;
    case "belarus-base":
      drawMilitaryStar(ctx, cx, cy, symbolR);
      break;
    case "ukraine-base":
      drawMilitaryStar(ctx, cx, cy, symbolR);
      break;
    case "russia-base":
      drawMilitaryStar(ctx, cx, cy, symbolR);
      break;
    case "conflict-battle":
      drawConflictBattleSymbol(ctx, cx, cy, symbolR);
      break;
    case "conflict-explosion":
      drawConflictExplosionSymbol(ctx, cx, cy, symbolR);
      break;
    case "conflict-protest":
      drawConflictProtestSymbol(ctx, cx, cy, symbolR);
      break;
    case "conflict-civilian":
      drawConflictCivilianSymbol(ctx, cx, cy, symbolR);
      break;
    case "conflict-strategic":
      drawConflictStrategicSymbol(ctx, cx, cy, symbolR);
      break;
    case "conflict-riot":
      drawConflictRiotSymbol(ctx, cx, cy, symbolR);
      break;
    case "battle-major":
      drawBattleMajorSymbol(ctx, cx, cy, symbolR);
      break;
  }

  const imgData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: imgData.data };
}

export const INFRA_ICON_DEFS: {
  id: string;
  category: InfraCategory;
  color: string;
}[] = [
  // Nuclear
  { id: "infra-nuclear-active", category: "nuclear", color: "#22c55e" },
  { id: "infra-nuclear-operational", category: "nuclear", color: "#22c55e" },
  { id: "infra-nuclear-occupied", category: "nuclear", color: "#ef4444" },
  { id: "infra-nuclear-decommissioned", category: "nuclear", color: "#6b7280" },
  // Dam
  { id: "infra-dam-operational", category: "dam", color: "#06b6d4" },
  { id: "infra-dam-destroyed", category: "dam", color: "#ef4444" },
  { id: "infra-dam-damaged", category: "dam", color: "#eab308" },
  // Bridge
  { id: "infra-bridge-operational", category: "bridge", color: "#8b5cf6" },
  { id: "infra-bridge-destroyed", category: "bridge", color: "#ef4444" },
  { id: "infra-bridge-damaged", category: "bridge", color: "#eab308" },
  // Port
  { id: "infra-port-operational", category: "port", color: "#3b82f6" },
  { id: "infra-port-occupied", category: "port", color: "#ef4444" },
  { id: "infra-port-limited", category: "port", color: "#eab308" },
  // Power Plant
  { id: "infra-power-plant-operational", category: "power-plant", color: "#f97316" },
  { id: "infra-power-plant-destroyed", category: "power-plant", color: "#ef4444" },
  { id: "infra-power-plant-damaged", category: "power-plant", color: "#eab308" },
  // Gas Station
  { id: "infra-gas-station-operational", category: "gas-station", color: "#a855f7" },
  { id: "infra-gas-station-shutdown", category: "gas-station", color: "#6b7280" },
  // NATO & Belarus bases
  { id: "nato-base", category: "nato-base", color: "#1b69a1" },
  { id: "belarus-base", category: "belarus-base", color: "#8b1a1a" },
  // Ukraine & Russia bases
  { id: "ukraine-base-active", category: "ukraine-base", color: "#005BBB" },
  { id: "ukraine-base-destroyed", category: "ukraine-base", color: "#ef4444" },
  { id: "ukraine-base-occupied", category: "ukraine-base", color: "#C53030" },
  { id: "ukraine-base-relocated", category: "ukraine-base", color: "#3D8FD6" },
  { id: "russia-base-active", category: "russia-base", color: "#C53030" },
  { id: "russia-base-damaged", category: "russia-base", color: "#eab308" },
  { id: "russia-base-destroyed", category: "russia-base", color: "#ef4444" },
];

export function loadInfrastructureIcons(mapInstance: maplibregl.Map) {
  for (const def of INFRA_ICON_DEFS) {
    if (!mapInstance.hasImage(def.id)) {
      mapInstance.addImage(def.id, createMapIcon(def.category, def.color, 28));
    }
  }
}

export const CONFLICT_ICON_DEFS: {
  id: string;
  category: InfraCategory;
  color: string;
}[] = [
  { id: "conflict-battle", category: "conflict-battle", color: "#ef4444" },
  { id: "conflict-explosion", category: "conflict-explosion", color: "#f97316" },
  { id: "conflict-protest", category: "conflict-protest", color: "#22c55e" },
  { id: "conflict-civilian", category: "conflict-civilian", color: "#a855f7" },
  { id: "conflict-strategic", category: "conflict-strategic", color: "#3b82f6" },
  { id: "conflict-riot", category: "conflict-riot", color: "#eab308" },
  { id: "battle-critical", category: "battle-major", color: "#ef4444" },
  { id: "battle-major", category: "battle-major", color: "#f97316" },
  { id: "battle-minor", category: "battle-major", color: "#eab308" },
];

export function loadConflictIcons(map: maplibregl.Map, size = 28) {
  for (const def of CONFLICT_ICON_DEFS) {
    if (!map.hasImage(def.id)) {
      map.addImage(def.id, createMapIcon(def.category, def.color, size));
    }
  }
}
