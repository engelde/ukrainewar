"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 2000,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastChangeTime = useRef(0);

  useEffect(() => {
    // Cancel any running animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const targetValue = value;
    const startValue = previousValue.current;

    // Use a single rAF to check timing and decide behavior
    animationRef.current = requestAnimationFrame((frameTime) => {
      const timeSinceLastChange = frameTime - lastChangeTime.current;
      lastChangeTime.current = frameTime;
      const isRapid = timeSinceLastChange < 500;

      if (isRapid) {
        // Rapid changes — snap immediately
        previousValue.current = targetValue;
        setDisplayValue(targetValue);
        return;
      }

      // Normal animation
      const startTime = frameTime;

      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(
          startValue + (targetValue - startValue) * eased
        );
        setDisplayValue(current);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          previousValue.current = targetValue;
        }
      }

      animate(frameTime);
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {displayValue.toLocaleString()}
    </span>
  );
}
