import { TbInfoCircle, TbX } from "react-icons/tb";
import { formatDateShort } from "./timeline-constants";

export interface TimelineEventCardProps {
  label: string;
  date: string;
  description: string;
  onDismiss: () => void;
}

export function TimelineEventCard({ label, date, description, onDismiss }: TimelineEventCardProps) {
  return (
    <div className="mx-3 mt-2.5 rounded-md bg-ua-blue/10 border border-ua-blue/20 px-4 py-2.5 flex items-start gap-2.5">
      <TbInfoCircle className="h-4 w-4 text-ua-blue mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[0.8125rem] font-semibold text-ua-blue">{label}</span>
          <span className="text-[0.6875rem] text-muted-foreground font-mono">
            {formatDateShort(date)}
          </span>
        </div>
        <p className="text-[0.75rem] text-foreground/80 mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss event info"
        className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        title="Dismiss"
      >
        <TbX className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
