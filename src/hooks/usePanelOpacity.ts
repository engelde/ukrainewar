"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ua-panel-opacity";
const DEFAULT_OPACITY = 80;
const MIN_OPACITY = 60;
const MAX_OPACITY = 100;
const STEP = 5;

export function usePanelOpacity() {
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const val = Number(stored);
        if (val >= MIN_OPACITY && val <= MAX_OPACITY) setOpacity(val);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(opacity));
    } catch {}
    document.documentElement.style.setProperty("--panel-opacity", String(opacity / 100));
  }, [opacity]);

  const increase = useCallback(() => {
    setOpacity((prev) => Math.min(MAX_OPACITY, prev + STEP));
  }, []);

  const decrease = useCallback(() => {
    setOpacity((prev) => Math.max(MIN_OPACITY, prev - STEP));
  }, []);

  const reset = useCallback(() => {
    setOpacity(DEFAULT_OPACITY);
  }, []);

  return {
    opacity,
    increase,
    decrease,
    reset,
    canIncrease: opacity < MAX_OPACITY,
    canDecrease: opacity > MIN_OPACITY,
    isDefault: opacity === DEFAULT_OPACITY,
  };
}
