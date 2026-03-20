import type { WsEvent } from "@/types/ws-event";
import { TYPE_CONFIG } from "./Config";
import { useState } from "react";
import { Check, Copy, Radio, Send } from "lucide-react";
import { Badge } from "../ui/badge";

/**
 * Single event row inside a gateway group.
 *
 * @param event      - The WsEvent to render.
 * @param isSelected - Whether this event is currently selected.
 * @param onSelect   - Called when the row is clicked.
 */
export function EventRow({
  event,
  isSelected,
  onSelect,
}: {
  event: WsEvent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const typeConf = TYPE_CONFIG[event.type];
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(event.event);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
        }
      }}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-1 transition-all duration-150 mb-0.5 group border cursor-pointer ${
        isSelected
          ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
          : "border-transparent hover:bg-zinc-800/60 hover:border-zinc-700/50"
      }`}
    >
      {/* Event name + type badge */}
      <div className="flex items-center gap-2">
        {/* Type icon */}
        <span
          className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
            isSelected
              ? event.type === "emit"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-emerald-500/20 text-emerald-400"
              : event.type === "emit"
                ? "bg-zinc-800 text-zinc-500 group-hover:bg-blue-500/10 group-hover:text-blue-400"
                : "bg-zinc-800 text-zinc-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-400"
          }`}
        >
          {event.type === "emit" ? (
            <Send className="w-2.5 h-2.5" />
          ) : (
            <Radio className="w-2.5 h-2.5" />
          )}
        </span>

        {/* Event name */}
        <span
          className={`flex-1 min-w-0 text-xs font-mono font-medium truncate transition-colors ${
            isSelected
              ? "text-zinc-100"
              : "text-zinc-300 group-hover:text-zinc-100"
          }`}
        >
          {event.event}
        </span>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          title="Copy event name"
          className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            copied
              ? "bg-emerald-500/20 text-emerald-400"
              : "hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300"
          }`}
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>

        {/* Type badge */}
        <Badge
          variant="outline"
          className={`text-[9px] shrink-0 px-1.5 h-4 gap-1 font-medium ${typeConf.className}`}
        >
          {typeConf.icon}
          {typeConf.label}
        </Badge>
      </div>

      {/* Description */}
      {event.description && (
        <span
          className={`text-[11px] leading-relaxed truncate pl-7 transition-colors ${
            isSelected
              ? "text-zinc-400"
              : "text-zinc-600 group-hover:text-zinc-500"
          }`}
        >
          {event.description}
        </span>
      )}
    </div>
  );
}
