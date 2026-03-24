"use client";

import type { MouseEvent, ReactNode, TouchEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DraggablePanelProps {
  children: ReactNode;
  className?: string;
  dragHandleClassName?: string;
}

export default function DraggablePanel({
  children,
  className,
  dragHandleClassName = "drag-handle",
}: DraggablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  }>({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  const clampOffset = useCallback(
    (x: number, y: number) => {
      if (!panelRef.current) return { x, y };
      const rect = panelRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 4;

      // Keep entire panel visible on screen (with padding from edges)
      const naturalLeft = rect.left - offset.x;
      const naturalTop = rect.top - offset.y;

      const minX = -naturalLeft + pad;
      const maxX = vw - naturalLeft - rect.width - pad;
      const minY = -naturalTop + pad;
      const maxY = vh - naturalTop - rect.height - pad;

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
      // Only drag from elements with the drag handle class or its children
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
  }, [clampOffset]);

  return (
    <div
      ref={panelRef}
      className={className}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      {children}
    </div>
  );
}
