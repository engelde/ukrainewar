"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "uawar-font-size";
const MIN_SIZE = 12;
const MAX_SIZE = 20;
const DEFAULT_SIZE = 16;
const STEP = 1;

export function useFontSize() {
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (parsed >= MIN_SIZE && parsed <= MAX_SIZE) {
          setFontSize(parsed);
          document.documentElement.style.fontSize = `${parsed}px`;
        }
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const update = useCallback((size: number) => {
    const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, size));
    setFontSize(clamped);
    document.documentElement.style.fontSize = `${clamped}px`;
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // localStorage unavailable
    }
  }, []);

  const increase = useCallback(() => update(fontSize + STEP), [fontSize, update]);
  const decrease = useCallback(() => update(fontSize - STEP), [fontSize, update]);
  const reset = useCallback(() => update(DEFAULT_SIZE), [update]);

  return {
    fontSize,
    increase,
    decrease,
    reset,
    canIncrease: fontSize < MAX_SIZE,
    canDecrease: fontSize > MIN_SIZE,
    isDefault: fontSize === DEFAULT_SIZE,
  };
}
