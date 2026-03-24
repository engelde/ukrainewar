"use client";

import { useEffect, useRef, useState } from "react";
import type { Battle } from "@/data/battles";
import { MAJOR_BATTLES } from "@/data/battles";

interface UseBattlesReturn {
  battles: Battle[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch battles from /api/battles (static + ACLED-enriched).
 * Falls back to static MAJOR_BATTLES if the API fails or while loading.
 */
export function useBattles(): UseBattlesReturn {
  const [battles, setBattles] = useState<Battle[]>(MAJOR_BATTLES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();

    async function fetchBattles() {
      try {
        const res = await fetch("/api/battles", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Battles API returned ${res.status}`);
        }

        const data: Battle[] = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setBattles(data);
          setError(null);
        } else {
          throw new Error("Battles API returned empty data");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Failed to fetch battles";
        console.warn("[useBattles] Falling back to static battles:", message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBattles();

    return () => {
      controller.abort();
    };
  }, []);

  return { battles, isLoading, error };
}
