"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ua-reduce-motion";

export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setReduceMotion(true);
        document.documentElement.classList.add("reduce-motion");
      }
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setReduceMotion((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      if (next) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
      return next;
    });
  }, []);

  return { reduceMotion, toggle };
}
