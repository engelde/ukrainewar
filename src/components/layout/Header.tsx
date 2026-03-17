import Link from "next/link";
import NavMenu from "./NavMenu";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between px-4 sm:h-14 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-3 bg-background/70 backdrop-blur-xl rounded-lg px-3 py-1.5 border border-border/40">
          {/* UA flag bar */}
          <div className="flex h-5 w-1 flex-col overflow-hidden rounded-full">
            <div className="h-1/2 bg-ua-blue" />
            <div className="h-1/2 bg-ua-yellow" />
          </div>
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              UKRAINE WAR TRACKER
            </h1>
          </Link>
        </div>
        <NavMenu />
      </div>
    </header>
  );
}

export function Footer() {
  return null;
}
