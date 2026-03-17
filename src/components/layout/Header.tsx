import Link from "next/link";
import { DATA_SOURCES } from "@/lib/constants";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between px-4 sm:h-14 sm:px-6">
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
    </header>
  );
}

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 px-4 py-2 sm:px-6 hidden sm:block">
      <div className="flex items-center gap-1 flex-wrap bg-background/60 backdrop-blur-xl rounded-lg px-3 py-1.5 border border-border/30 max-w-fit">
        <span className="text-[10px] text-muted-foreground mr-1">Sources:</span>
        {DATA_SOURCES.map((source, i) => (
          <span key={source.name} className="text-[10px]">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-ua-blue transition-colors"
              title={source.description}
            >
              {source.name}
            </a>
            {i < DATA_SOURCES.length - 1 && (
              <span className="text-border mx-1">·</span>
            )}
          </span>
        ))}
      </div>
    </footer>
  );
}
