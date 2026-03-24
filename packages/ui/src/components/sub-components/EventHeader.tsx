import { ChevronRight, Radio, Send, Zap } from "lucide-react";
import type { SelectedEvent } from "@/store/wsgate.store";
import { Badge } from "../ui/badge";

/**
 * Renders the header section of an event display component.
 *
 * Shows event metadata including namespace, event type (emit/receive), description,
 * and the complete call chain (namespace -> gateway -> handler).
 *
 * @component
 * @param {Object} props - Component props
 * @param {SelectedEvent} props.event - The event object containing type, namespace, event name, description, gateway name, and handler name
 * @returns {JSX.Element} A flex container with event header information including:
 *   - Namespace display badge
 *   - Event type icon and name with description
 *   - Event type badge (emit/receive)
 *   - Breadcrumb trail showing namespace → gateway → handler
 *
 * @example
 * ```tsx
 * <EventHeader event={selectedEvent} />
 * ```
 */
export function EventHeader({ event }: { event: SelectedEvent }) {
  const isEmit = event.type === "emit";
  const nsDisplay =
    event.namespace === "/"
      ? "Global"
      : (event.namespace?.slice(1).toUpperCase() ?? "GLOBAL");
  return (
    <div className="flex flex-col gap-3 pb-4 border-b border-zinc-800/80 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-[9px] font-mono font-semibold text-blue-300 uppercase tracking-widest">
          {nsDisplay} Namespace
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${isEmit ? "bg-blue-500/15 border border-blue-500/30" : "bg-emerald-500/15 border border-emerald-500/30"}`}
          >
            {isEmit ? (
              <Send className="w-4 h-4 text-blue-400" />
            ) : (
              <Radio className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold font-mono text-zinc-100 truncate">
              {event.event}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
              {event.description}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-xs gap-1 ${isEmit ? "border-blue-500/40 text-blue-400 bg-blue-500/5" : "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"}`}
        >
          {isEmit ? (
            <Send className="w-2.5 h-2.5" />
          ) : (
            <Radio className="w-2.5 h-2.5" />
          )}
          {event.type}
        </Badge>
      </div>
      <div className="flex items-center gap-2 flex-wrap pl-11">
        <Badge
          variant="outline"
          className="text-[10px] border-blue-500/40 text-blue-300 bg-blue-500/10 gap-1.5 font-mono font-semibold"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {event.namespace ?? "/"}
        </Badge>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
        <Badge
          variant="outline"
          className="text-[10px] border-zinc-700 text-zinc-500 gap-1"
        >
          <Zap className="w-2.5 h-2.5 text-blue-400" />
          {event.gatewayName}
        </Badge>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
        <Badge
          variant="outline"
          className="text-[10px] border-zinc-700 text-zinc-500 gap-1 font-mono"
        >
          {event.handlerName}()
        </Badge>
      </div>
    </div>
  );
}
