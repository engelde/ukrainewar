import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Position {
  x: number;
  y: number;
}

interface PanelPositionState {
  positions: Record<string, Position>;
  setPosition: (panelKey: string, pos: Position) => void;
  clearPositions: () => void;
}

export const usePanelPositionStore = create<PanelPositionState>()(
  persist(
    (set) => ({
      positions: {},
      setPosition: (panelKey, pos) =>
        set((state) => ({
          positions: { ...state.positions, [panelKey]: pos },
        })),
      clearPositions: () => set({ positions: {} }),
    }),
    { name: "ua-panel-positions" },
  ),
);
