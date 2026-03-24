"use client";

import type { MouseEvent, ReactNode, TouchEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePanelPositionStore } from "@/stores/panelPositionStore";

interface DraggablePanelProps {
  children: ReactNode;
  className?: string;
  dragHandleClassName?: string;
  panelKey?: string;
  defaultPosition?: { x: number; y: number };
}

export default function DraggablePanel({
  children,
  className,
  dragHandleClassName = "drag-handle",
  panelKey,
  defaultPosition,
}: DraggablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const storedPositions = usePanelPositionStore((s) => s.positions);
  const setStoredPosition = usePanelPositionStore((s) => s.setPosition);
  const stored = panelKey ? storedPositions[panelKey] : undefined;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const dragState = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  }>({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  // Initialize offset from zustand store after mount
  useEffect(() => {
    if (stored) {
      setOffset(stored);
    }
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clampOffset = useCallback(
    (x: number, y: number) => {
      if (!panelRef.current) return { x, y };
      const rect = panelRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const sidePad = 8;
      const topPad = 56; // below nav bar
      const bottomPad = 96; // above timeline area

      const naturalLeft = rect.left - offset.x;
      const naturalTop = rect.top - offset.y;

      const minX = -naturalLeft + sidePad;
      const maxX = vw - naturalLeft - rect.width - sidePad;
      const minY = -naturalTop + topPad;
      const maxY = vh - naturalTop - rect.height - bottomPad;

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    },
    [offset],
  );

  const handlePointerDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${dragHandleClassName}`)) return;

      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      dragState.current = {
        isDragging: true,
        startX: clientX,
        startY: clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
    },
    [offset, dragHandleClassName],
  );

  useEffect(() => {
    const handleMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!dragState.current.isDragging) return;
      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragState.current.startX;
      const dy = clientY - dragState.current.startY;
      const newOffset = clampOffset(dragState.current.offsetX + dx, dragState.current.offsetY + dy);
      setOffset(newOffset);
    };

    const handleUp = () => {
      if (dragState.current.isDragging && panelKey) {
        // Persist final position to zustand
        setStoredPosition(panelKey, {
          x: offset.x,
          y: offset.y,
        });
      }
      dragState.current.isDragging = false;
    };

    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [clampOffset, panelKey, offset, setStoredPosition]);

  // Build style: use defaultPosition for absolute placement, or className for fixed
  const style: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  if (defaultPosition) {
    style.position = "fixed";
    style.left = defaultPosition.x;
    style.top = defaultPosition.y;
    style.zIndex = 30;
    // Prevent flash of unstyled position before zustand loads
    if (!mounted) style.opacity = 0;
  }

  return (
    <div
      ref={panelRef}
      className={defaultPosition ? "max-w-xs" : className}
      style={style}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      {children}
    </div>
  );
}
