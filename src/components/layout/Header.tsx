"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import NavMenu from "./NavMenu";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between px-4 sm:h-14 sm:px-6">
        <div className="flex items-center gap-2 bg-background/70 backdrop-blur-xl rounded-lg px-3 py-1.5 border border-border/40">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground h-7 w-7" />
          <Image src="/icon.svg" alt="" width={20} height={20} className="h-5 w-5 rounded-[4px]" />
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              RUSSO-UKRAINIAN WAR TRACKER
            </h1>
          </Link>
          <div className="hidden sm:contents">
            <div className="w-px h-4 bg-border/40" />
            <NavMenu />
          </div>
        </div>
      </header>

      {mobileMenuOpen && <NavMenu mobile onClose={() => setMobileMenuOpen(false)} />}
    </>
  );
}

export function Footer() {
  return null;
}
