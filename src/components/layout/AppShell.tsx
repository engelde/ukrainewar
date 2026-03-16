"use client";

import dynamic from "next/dynamic";
import type { CasualtyData } from "@/lib/types";
import StatsOverlay from "@/components/stats/StatsOverlay";
import Header, { Footer } from "@/components/layout/Header";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ua-blue border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    </div>
  ),
});

interface AppShellProps {
  casualtyData: CasualtyData | null;
}

export default function AppShell({ casualtyData }: AppShellProps) {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <MapView />
      <Header />
      {casualtyData && <StatsOverlay data={casualtyData} />}
      <Footer />
    </main>
  );
}
