import Link from "next/link";
import { TbMap2 } from "react-icons/tb";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <TbMap2 className="h-24 w-24 text-white" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-white font-mono mb-10">404</h1>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Map
        </Link>
      </div>
    </div>
  );
}
