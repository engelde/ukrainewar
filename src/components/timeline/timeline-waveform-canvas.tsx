"use client";

import { memo, useEffect, useRef } from "react";
import { PIXELS_PER_DAY } from "./timeline-constants";

export interface TimelineWaveformCanvasProps {
  dates: string[];
  dailyLosses: Map<string, number>;
  maxDaily: number;
  totalWidth: number;
  currentIndex: number;
}

const WAVE_HEIGHT = 22;
const WAVE_TOP = 3;

export const TimelineWaveformCanvas = memo(function TimelineWaveformCanvas({
  dates,
  dailyLosses,
  maxDaily,
  totalWidth,
  currentIndex,
}: TimelineWaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = WAVE_HEIGHT * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, WAVE_HEIGHT);

    const barWidth = PIXELS_PER_DAY;
    const mid = WAVE_HEIGHT / 2;

    for (let i = 0; i < dates.length; i++) {
      const val = dailyLosses.get(dates[i]) ?? 0;
      if (val === 0) continue;

      const ratio = val / maxDaily;
      const halfH = ratio * (WAVE_HEIGHT / 2 - 1);

      const isPast = i <= currentIndex;
      if (isPast) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
      } else {
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
      }

      const x = i * barWidth;
      ctx.fillRect(x, mid - halfH, Math.max(barWidth - 0.5, 1), halfH * 2);
    }
  }, [dates, dailyLosses, maxDaily, totalWidth, currentIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-0 pointer-events-none"
      style={{
        top: `${WAVE_TOP}px`,
        width: `${totalWidth}px`,
        height: `${WAVE_HEIGHT}px`,
      }}
    />
  );
});
