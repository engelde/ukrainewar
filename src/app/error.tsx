"use client";

import { useEffect } from "react";
import { TbAlertTriangle, TbRefresh } from "react-icons/tb";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[War Tracker Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.13_0.02_260)]">
      <div className="mx-4 max-w-md rounded-xl border border-white/10 bg-black/60 p-8 text-center shadow-2xl backdrop-blur-md">
        <TbAlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
        <h2 className="mb-2 text-xl font-semibold text-white">Something went wrong</h2>
        <p className="mb-6 text-sm text-zinc-400">
          An unexpected error occurred while loading data. This may be a temporary issue with one of
          our data sources.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-95"
        >
          <TbRefresh className="h-4 w-4" />
          Try Again
        </button>
        {error.digest && <p className="mt-4 text-xs text-zinc-600">Error ID: {error.digest}</p>}
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400">
            Technical details
          </summary>
          <pre className="mt-2 max-h-32 overflow-auto rounded bg-white/5 p-2 text-xs text-zinc-500">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}
