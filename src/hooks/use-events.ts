"use client";

import { useEffect, useRef, useState } from "react";
import type { WarEvent } from "@/data/events";
import { KEY_EVENTS } from "@/data/events";

interface UseEventsReturn {
  events: WarEvent[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch dynamic war events from /api/events.
 * Falls back to hardcoded KEY_EVENTS if the API fails or while loading.
 */
export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<WarEvent[]>(KEY_EVENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();

    async function fetchEvents() {
      try {
        const res = await fetch("/api/events", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Events API returned ${res.status}`);
        }

        const data: WarEvent[] = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setError(null);
        } else {
          throw new Error("Events API returned empty data");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Failed to fetch events";
        console.warn("[useEvents] Falling back to static events:", message);
        setError(message);
        // Keep KEY_EVENTS as fallback (already set as initial state)
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();

    return () => {
      controller.abort();
    };
  }, []);

  return { events, isLoading, error };
}
