"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 2000,
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastChangeTime = useRef(0);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const targetValue = value;
    const startValue = previousValue.current;

    animationRef.current = requestAnimationFrame((frameTime) => {
      const timeSinceLastChange = frameTime - lastChangeTime.current;
      lastChangeTime.current = frameTime;
      const isRapid = timeSinceLastChange < 500;

      if (isRapid) {
        previousValue.current = targetValue;
        setDisplayValue(targetValue);
        return;
      }

      const startTime = frameTime;
      const multiplier = 10 ** decimals;

      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        const current =
          Math.round((startValue + (targetValue - startValue) * eased) * multiplier) / multiplier;
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
  }, [value, duration, decimals]);

  const formatted =
    decimals > 0
      ? displayValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : displayValue.toLocaleString();

  return <span className={cn("tabular-nums", className)}>{formatted}</span>;
}

export default AnimatedCounter;
