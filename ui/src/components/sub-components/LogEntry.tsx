import { relativeTime } from "@/lib/utils";
import type { Log } from "@/store/wsgate.store";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
} from "lucide-react";
import { memo, useMemo } from "react";
import { LatencyChip } from "./LatencyChip";
import { PayloadSection } from "./PayloadSection";

type TimestampMode = "absolute" | "relative";

export const LogEntry = memo(function LogEntry({
  log,
  isExpanded,
  isAckExpanded,
  isPinned,
  tsMode,
  onToggle,
  onToggleAck,
  onTogglePin,
  onFilterByEvent,
}: {
  log: Log & { _sentAt?: string };
  isExpanded: boolean;
  isAckExpanded: boolean;
  isPinned: boolean;
  tsMode: TimestampMode;
  onToggle: () => void;
  onToggleAck: () => void;
  onTogglePin: () => void;
  onFilterByEvent: (event: string) => void;
}) {
  const isOut = log.direction === "out";
  const hasData = log.data !== undefined && log.data !== null;
  const hasAck = log.ack !== undefined;

  const latencyMs = useMemo(() => {
    if (!hasAck || !log._sentAt || !log.ack?.timestamp) return null;
    const delta =
      new Date(log.ack.timestamp).getTime() - new Date(log._sentAt).getTime();
    return delta > 0 ? delta : null;
  }, [hasAck, log._sentAt, log.ack]);

  const displayTs =
    tsMode === "relative" && log._sentAt
      ? relativeTime(log._sentAt)
      : log.timestamp;

  return (
    <div
      className={[
        /*
         * shrink-0 is the CRITICAL fix for card-height clipping.
         * LogEntry cards are flex children inside `flex flex-col overflow-y-auto`.
         * Flex children default to flex-shrink:1, so the flex algorithm compresses
         * them to fit the scroll container's bounded height. With overflow-hidden on
         * the card, compressed content is silently clipped.
         * shrink-0 = flex-shrink:0 → cards are always sized to their natural content
         * height, and the scroll container scrolls to show all of them.
         */
        "rounded-xl border overflow-hidden transition-colors duration-150 group shrink-0",
        isPinned && "ring-1 ring-amber-500/20",
        isPinned && "border-l-[3px]",
        isPinned && isOut && "border-l-amber-500/50",
        isPinned && !isOut && "border-l-amber-500/50",
        isOut
          ? isExpanded
            ? "border-blue-500/40 bg-blue-500/5"
            : "border-blue-500/20 bg-blue-500/3 hover:border-blue-500/35 hover:bg-blue-500/5"
          : isExpanded
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-emerald-500/20 bg-emerald-500/3 hover:border-emerald-500/35 hover:bg-emerald-500/5",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={onToggle}
      >
        {/* Direction */}
        <div
          className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
            isOut
              ? "bg-blue-500/15 text-blue-400"
              : "bg-emerald-500/15 text-emerald-400"
          }`}
        >
          {isOut ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
        </div>

        {/* Event name — click to filter */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFilterByEvent(log.event);
          }}
          title={`Filter: "${log.event}"`}
          className={`flex-1 min-w-0 text-xs font-mono font-medium truncate text-left hover:underline underline-offset-2 ${
            isOut
              ? "text-blue-300 hover:text-blue-200"
              : "text-emerald-300 hover:text-emerald-200"
          }`}
        >
          {log.event}
        </button>

        {latencyMs !== null && <LatencyChip ms={latencyMs} />}

        {/* ACK badge */}
        {hasAck && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAck();
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-semibold transition-all text-[9px] shrink-0 ${
              isAckExpanded
                ? "border-purple-500/50 text-purple-200 bg-purple-500/20"
                : "border-purple-500/30 text-purple-600 bg-purple-500/5 hover:text-purple-400"
            }`}
          >
            <Check className="w-2.5 h-2.5" />
            ACK
            {isAckExpanded ? (
              <ChevronUp className="w-2.5 h-2.5" />
            ) : (
              <ChevronDown className="w-2.5 h-2.5" />
            )}
          </button>
        )}

        {/* Timestamp */}
        <span
          className="text-[10px] text-zinc-600 font-mono shrink-0"
          title={log._sentAt}
        >
          {displayTs}
        </span>

        {/* Pin — visible on hover or when pinned */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          title={isPinned ? "Unpin" : "Pin this entry"}
          className={`shrink-0 p-0.5 rounded-md transition-all ${
            isPinned
              ? "text-amber-400 opacity-100"
              : "text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:bg-zinc-800"
          }`}
        >
          {isPinned ? (
            <PinOff className="w-3 h-3" />
          ) : (
            <Pin className="w-3 h-3" />
          )}
        </button>

        {/* Chevron */}
        {hasData && (
          <span
            className={`shrink-0 ${isExpanded ? "text-zinc-400" : "text-zinc-700"}`}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>

      {/* Payload */}
      {isExpanded && hasData && (
        <PayloadSection
          data={log.data}
          label="Payload"
          labelColor={isOut ? "text-blue-400" : "text-emerald-400"}
        />
      )}

      {/* ACK */}
      {isAckExpanded && hasAck && (
        <PayloadSection
          data={log.ack!.data}
          label="Acknowledgment"
          labelColor="text-purple-400"
          extra={
            <span className="text-[9px] text-zinc-700 font-mono">
              {log.ack!.timestamp}
            </span>
          }
        />
      )}
    </div>
  );
});
