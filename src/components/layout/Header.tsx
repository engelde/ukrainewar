"use client";

import { useState } from "react";
import Link from "next/link";
import NavMenu from "./NavMenu";
import { TbMenu2, TbCalendarEvent } from "react-icons/tb";

interface HeaderProps {
  onToggleEvents?: () => void;
  eventsOpen?: boolean;
}

export default function Header({ onToggleEvents, eventsOpen }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between px-4 sm:h-14 sm:px-6">
        <div className="flex items-center gap-3 bg-background/70 backdrop-blur-xl rounded-lg px-3 py-1.5 border border-border/40">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <TbMenu2 className="h-4 w-4" />
          </button>
          {/* UA flag bar */}
          <div className="flex h-5 w-1 flex-col overflow-hidden rounded-full">
            <div className="h-1/2 bg-ua-blue" />
            <div className="h-1/2 bg-ua-yellow" />
          </div>
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              RUSSO-UKRAINIAN WAR TRACKER
            </h1>
          </Link>
          {/* Events button */}
          {onToggleEvents && (
            <>
              <div className="w-px h-4 bg-border/40" />
              <button
                onClick={onToggleEvents}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  eventsOpen
                    ? "text-ua-yellow bg-ua-yellow/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TbCalendarEvent className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Events</span>
              </button>
            </>
          )}
          {/* Desktop nav links */}
          <div className="hidden sm:contents">
            <div className="w-px h-4 bg-border/40" />
            <NavMenu />
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <NavMenu mobile onClose={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
}

export function Footer() {
  return null;
}
