"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { TbMenu2 } from "react-icons/tb";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import NavMenu from "./NavMenu";

interface HeaderProps {
  eventsOpen?: boolean;
  onToggleEvents?: () => void;
  panelToggles?: {
    humanitarian?: () => void;
    spending?: () => void;
    energy?: () => void;
    airDefense?: () => void;
    support?: () => void;
    ukraineLosses?: () => void;
    sanctions?: () => void;
  };
  panelStates?: {
    humanitarian?: boolean;
    spending?: boolean;
    energy?: boolean;
    airDefense?: boolean;
    support?: boolean;
    ukraineLosses?: boolean;
    sanctions?: boolean;
  };
}

export default function Header({
  eventsOpen,
  onToggleEvents,
  panelToggles,
  panelStates,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between px-4 sm:h-14 sm:px-6">
        <div className="flex items-center gap-2 bg-background/70 backdrop-blur-xl rounded-lg px-3 py-1.5 border border-border/40">
          {/* Mobile hamburger — opens mobile nav drawer */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <TbMenu2 className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </button>
          <Image src="/icon.svg" alt="" width={20} height={20} className="h-5 w-5 rounded-[4px]" />
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              {t("header.title")}
            </h1>
          </Link>
          <div className="hidden sm:contents">
            <div className="w-px h-4 bg-border/40" />
            <NavMenu
              eventsOpen={eventsOpen}
              onToggleEvents={onToggleEvents}
              panelToggles={panelToggles}
              panelStates={panelStates}
            />
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <NavMenu
          mobile
          onClose={() => setMobileMenuOpen(false)}
          eventsOpen={eventsOpen}
          onToggleEvents={onToggleEvents}
          panelToggles={panelToggles}
          panelStates={panelStates}
        />
      )}
    </>
  );
}

export function Footer() {
  return null;
}
