import Link from "next/link";
import { TbMapSearch, TbArrowLeft } from "react-icons/tb";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <TbMapSearch className="h-20 w-20 text-ua-blue/40" />
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destruction/80 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">!</span>
            </div>
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-foreground font-mono mb-2">
          404
        </h1>
        <p className="text-lg text-ua-blue font-semibold mb-3">
          Territory Not Found
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Return to the map to continue tracking the conflict.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-surface-elevated border border-border/50 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated/80 hover:border-ua-blue/30 transition-colors"
        >
          <TbArrowLeft className="h-4 w-4" />
          Back to Map
        </Link>

        <div className="mt-10 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ua-blue/30" />
          <span>uawar.app</span>
        </div>
      </div>
    </div>
  );
}
