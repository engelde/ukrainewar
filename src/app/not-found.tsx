import Link from "next/link";
import { TbMap2 } from "react-icons/tb";
import { t } from "@/i18n";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.13_0.02_260)]">
      <div className="mx-4 max-w-md rounded-xl border border-white/10 bg-black/60 p-8 text-center shadow-2xl backdrop-blur-md">
        <TbMap2 className="mx-auto mb-4 h-12 w-12 text-zinc-500" />
        <h1 className="mb-2 font-mono text-6xl font-bold text-white">404</h1>
        <p className="mb-6 text-sm text-zinc-400">{t("notFound.message")}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-95"
        >
          {t("notFound.backToMap")}
        </Link>
      </div>
    </div>
  );
}
