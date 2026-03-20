/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useRef, useEffect, useState, useMemo, useCallback, memo } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ScrollText,
  CircleSlash,
  X,
  Pin,
  PinOff,
  Download,
  Pause,
  Play,
  ChevronsUpDown,
  ChevronsDownUp,
  Clock,
  Timer,
  Lock,
  Unlock,
  Activity,
  FileJson,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWsgateStore, type Log } from "@/store/wsgate.store";

// ── Types ─────────────────────────────────────────────

type DirectionFilter = "all" | "in" | "out";
type TimestampMode = "absolute" | "relative";

// ── Helpers ───────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Lightweight JSON syntax highlighter.
 *
 * WHY this replaces Monaco in log cards:
 * Monaco requires an explicit pixel height. With `wordWrap: on`, the rendered
 * height depends on the container width — so any `lines * 18` formula is
 * wrong whenever the container resizes or content wraps. This causes the
 * card-height clipping visible in the screenshot.
 *
 * A `<pre>` tag is height-agnostic — it expands exactly to its content.
 * No calculation, no cap, no clipping. Also ~100× lighter for 200 entries.
 */
function highlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let style = "color:#ce9178"; // string value — orange
        if (/^"/.test(match)) {
          if (/:$/.test(match)) style = "color:#9cdcfe"; // key — blue
          // else string value stays orange
        } else if (/true|false/.test(match)) {
          style = "color:#569cd6"; // boolean — blue
        } else if (/null/.test(match)) {
          style = "color:#808080"; // null — grey
        } else {
          style = "color:#b5cea8"; // number — green
        }
        return `<span style="${style}">${match}</span>`;
      },
    );
}

// ── Constants ─────────────────────────────────────────

const DIRECTION_CONFIG = {
  all: {
    icon: <ArrowUpDown className="w-3 h-3" />,
    label: "All",
    activeClass: "bg-zinc-700 text-zinc-100 border-zinc-600",
  },
  out: {
    icon: <ArrowUp className="w-3 h-3" />,
    label: "Out",
    activeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  in: {
    icon: <ArrowDown className="w-3 h-3" />,
    label: "In",
    activeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
} as const;

const LOG_BUFFER_LIMIT = 200;

// ── JsonViewer ────────────────────────────────────────

/**
 * Read-only JSON viewer using a native `<pre>` tag.
 * Height is content-driven — expands naturally, no math, no clipping.
 * `max-h-[260px] overflow-y-auto` adds a scroll window for huge payloads
 * without capping smaller ones.
 */
const JsonViewer = memo(function JsonViewer({ data }: { data: unknown }) {
  const highlighted = useMemo(() => highlightJson(safeStringify(data)), [data]);
  return (
    <pre
      className="text-[11.5px] leading-relaxed font-mono p-3 overflow-x-auto overflow-y-auto max-h-[260px] bg-transparent whitespace-pre-wrap break-words text-zinc-300"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
});

// ── Sub-components ────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 select-none py-16">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        {hasFilter ? (
          <CircleSlash className="w-5 h-5 text-zinc-700" />
        ) : (
          <ScrollText className="w-5 h-5 text-zinc-700" />
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-medium text-zinc-500">
          {hasFilter ? "No matching events" : "No events yet"}
        </p>
        <p className="text-[10px] text-zinc-700 text-center leading-relaxed">
          {hasFilter
            ? "Try adjusting your filter"
            : "Emit an event to see it here"}
        </p>
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handle(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-all ${
        copied
          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
          : "border-zinc-700 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-2.5 h-2.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-2.5 h-2.5" />
          Copy
        </>
      )}
    </button>
  );
}

function LatencyChip({ ms }: { ms: number }) {
  const color =
    ms < 100
      ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8"
      : ms < 500
        ? "text-amber-400 border-amber-500/25 bg-amber-500/8"
        : "text-red-400 border-red-500/25 bg-red-500/8";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-mono border rounded-md px-1.5 py-0.5 shrink-0 ${color}`}
      title={`ACK latency: ${ms}ms`}
    >
      <Timer className="w-2 h-2" />
      {formatLatency(ms)}
    </span>
  );
}

/**
 * PayloadSection — label bar + JsonViewer.
 * The <pre> inside sets its own height; the card grows to fit.
 */
function PayloadSection({
  data,
  label,
  labelColor,
  extra,
}: {
  data: unknown;
  label: string;
  labelColor: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="border-t border-white/5">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/20">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-widest font-semibold ${labelColor}`}
          >
            {label}
          </span>
          {extra}
        </div>
        <CopyBtn text={safeStringify(data)} />
      </div>
      <div className="bg-zinc-950/60">
        <JsonViewer data={data} />
      </div>
    </div>
  );
}

// ── LogEntry ──────────────────────────────────────────

const LogEntry = memo(function LogEntry({
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

// ── Section separators ────────────────────────────────

function PinnedSeparator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <Pin className="w-2.5 h-2.5 text-amber-500/60" />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500/50">
        Pinned ({count})
      </span>
      <div className="flex-1 h-px bg-amber-500/10" />
    </div>
  );
}

function StreamSeparator() {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <Activity className="w-2.5 h-2.5 text-zinc-600" />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-700">
        Stream
      </span>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  );
}

// ── Export menu ───────────────────────────────────────

function ExportMenu({ logs, onClose }: { logs: Log[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const items = [
    {
      icon: <FileJson className="w-3 h-3" />,
      label: "Download all (.json)",
      fn() {
        downloadJson(
          logs.map((l) => ({
            event: l.event,
            direction: l.direction,
            data: l.data,
            ack: l.ack,
          })),
          `wsgate-log-${Date.now()}.json`,
        );
        onClose();
      },
    },
    {
      icon: <ArrowUp className="w-3 h-3 text-blue-400" />,
      label: "Download emits only",
      fn() {
        downloadJson(
          logs
            .filter((l) => l.direction === "out")
            .map((l) => ({ event: l.event, data: l.data, ack: l.ack })),
          `wsgate-emit-${Date.now()}.json`,
        );
        onClose();
      },
    },
    {
      icon: <Copy className="w-3 h-3" />,
      label: "Copy all to clipboard",
      fn() {
        navigator.clipboard.writeText(
          JSON.stringify(
            logs.map((l) => ({
              event: l.event,
              direction: l.direction,
              data: l.data,
            })),
            null,
            2,
          ),
        );
        onClose();
      },
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-52 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-zinc-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Export
        </span>
      </div>
      <div className="flex flex-col py-1">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.fn}
            className="flex items-center gap-2.5 px-3 py-2 text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors text-left"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Buffer bar ────────────────────────────────────────

function BufferBar({ count }: { count: number }) {
  const pct = Math.min((count / LOG_BUFFER_LIMIT) * 100, 100);
  const warn = pct >= 80;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-t border-zinc-800/40 shrink-0">
      <div className="flex-1 h-0.5 rounded-full bg-zinc-900 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${warn ? "bg-amber-500/50" : "bg-zinc-700"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[9px] font-mono shrink-0 ${warn ? "text-amber-500/70" : "text-zinc-700"}`}
      >
        {count}/{LOG_BUFFER_LIMIT}
      </span>
    </div>
  );
}

// ── IconBtn ───────────────────────────────────────────

function IconBtn({
  onClick,
  title,
  active,
  activeClass = "text-blue-400 border-blue-500/20 bg-blue-500/8",
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  activeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md border transition-all ${
        active
          ? activeClass
          : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main Component ────────────────────────────────────

export default function EventLog() {
  const { logs: storeLogs, clearLogs } = useWsgateStore();

  // ── Live / Paused ─────────────────────────────────────
  const [paused, setPaused] = useState(false);
  const [displayLogs, setDisplayLogs] = useState<Log[]>(storeLogs);
  const [pendingCount, setPendingCount] = useState(0);
  const pausedRef = useRef<Log[]>([]);

  useEffect(() => {
    if (!paused) {
      setDisplayLogs(storeLogs);
      setPendingCount(0);
    } else {
      setPendingCount(Math.max(storeLogs.length - pausedRef.current.length, 0));
    }
  }, [storeLogs, paused]);

  function handlePause() {
    pausedRef.current = storeLogs;
    setPaused(true);
  }
  function handleResume() {
    setPaused(false);
  }

  // ── Core state ────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [expandedAck, setExpandedAck] = useState<Set<number>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [filterInput, setFilterInput] = useState("");
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [searchFocus, setSearchFocus] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [tsMode, setTsMode] = useState<TimestampMode>("absolute");
  const [exportOpen, setExportOpen] = useState(false);

  // Debounced live search
  const [debouncedFilter, setDebouncedFilter] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filterInput), 150);
    return () => clearTimeout(t);
  }, [filterInput]);

  // ── Filtering ─────────────────────────────────────────
  const { filteredLogs, regexError } = useMemo(() => {
    let result = displayLogs;
    if (direction !== "all")
      result = result.filter((l) => l.direction === direction);
    if (!debouncedFilter) return { filteredLogs: result, regexError: false };
    try {
      const re = new RegExp(debouncedFilter, "i");
      return {
        filteredLogs: result.filter((l) => re.test(l.event)),
        regexError: false,
      };
    } catch {
      return { filteredLogs: result, regexError: true };
    }
  }, [debouncedFilter, displayLogs, direction]);

  const pinnedLogs = filteredLogs.filter((l) => pinnedIds.has(l.id));
  const streamLogs = filteredLogs.filter((l) => !pinnedIds.has(l.id));

  // ── Auto-scroll ───────────────────────────────────────
  useEffect(() => {
    if (autoScroll && !paused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayLogs, autoScroll, paused]);

  // ── Handlers ──────────────────────────────────────────
  const toggle = (id: number) =>
    setExpanded((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAck = (id: number) =>
    setExpandedAck((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const togglePin = (id: number) =>
    setPinnedIds((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const expandAll = () => setExpanded(new Set(filteredLogs.map((l) => l.id)));
  const collapseAll = () => {
    setExpanded(new Set());
    setExpandedAck(new Set());
  };

  function handleClear() {
    clearLogs();
    setPinnedIds(new Set());
    setExpanded(new Set());
    setExpandedAck(new Set());
  }

  const filterByEvent = useCallback(
    (event: string) => setFilterInput(event),
    [],
  );

  const hasFilter = !!(debouncedFilter || direction !== "all");
  const outCount = displayLogs.filter((l) => l.direction === "out").length;
  const inCount = displayLogs.filter((l) => l.direction === "in").length;

  // ── Render ────────────────────────────────────────────
  return (
    /*
     * SCROLL CONTRACT:
     * This root div has `overflow-hidden` — mandatory to bound the flex column.
     * The log area uses `flex-1 min-h-0 overflow-y-auto`.
     * `min-h-0` is the non-obvious key: without it, flex items in a column
     * refuse to shrink below content height, so the area grows past the
     * viewport instead of scrolling.
     */
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* ══ HEADER — two rows to avoid cramping ══ */}
      <div className="px-4 pt-3 pb-2 border-b border-zinc-800 shrink-0 flex flex-col gap-2">
        {/* Row 1 — title + counters */}
        <div className="flex items-center gap-2 min-w-0">
          <ScrollText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <h2 className="text-sm font-semibold text-zinc-100 shrink-0">
            Event Log
          </h2>

          {displayLogs.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] border-zinc-700 text-zinc-500 px-1.5 h-4 shrink-0"
            >
              {filteredLogs.length}/{displayLogs.length}
            </Badge>
          )}

          {paused && pendingCount > 0 && (
            <span className="text-[9px] font-mono text-amber-400 border border-amber-500/25 bg-amber-500/8 rounded-md px-1.5 py-0.5 shrink-0 animate-pulse">
              +{pendingCount} pending
            </span>
          )}

          <div className="flex-1" />

          {/* Inline stats */}
          {displayLogs.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-2.5 h-2.5 text-blue-400" />
                <span className="text-[10px] text-zinc-600">
                  {outCount} out
                </span>
              </span>
              <span className="flex items-center gap-1">
                <ArrowDown className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[10px] text-zinc-600">{inCount} in</span>
              </span>
              {pinnedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-[10px] text-amber-600/70">
                    {pinnedIds.size} pinned
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Row 2 — toolbar */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Timestamp mode */}
          <IconBtn
            onClick={() =>
              setTsMode((m) => (m === "absolute" ? "relative" : "absolute"))
            }
            title={`Switch to ${tsMode === "absolute" ? "relative" : "absolute"} timestamps`}
            active={tsMode === "relative"}
            activeClass="text-blue-400 border-blue-500/20 bg-blue-500/8"
          >
            {tsMode === "absolute" ? (
              <Clock className="w-3 h-3" />
            ) : (
              <Timer className="w-3 h-3" />
            )}
          </IconBtn>

          {/* Auto-scroll lock */}
          <IconBtn
            onClick={() => setAutoScroll((v) => !v)}
            title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
            active={autoScroll}
            activeClass="text-emerald-400 border-emerald-500/20 bg-emerald-500/8"
          >
            {autoScroll ? (
              <Unlock className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
          </IconBtn>

          {/* Expand / collapse all */}
          <IconBtn onClick={expandAll} title="Expand all">
            <ChevronsUpDown className="w-3 h-3" />
          </IconBtn>
          <IconBtn onClick={collapseAll} title="Collapse all">
            <ChevronsDownUp className="w-3 h-3" />
          </IconBtn>

          <div className="w-px h-4 bg-zinc-800 mx-0.5 shrink-0" />

          {/* Pause / Resume */}
          <button
            onClick={paused ? handleResume : handlePause}
            className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              paused
                ? "text-amber-400 border-amber-500/30 bg-amber-500/8 hover:bg-amber-500/15"
                : "text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {paused ? (
              <>
                <Play className="w-3 h-3" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                Pause
              </>
            )}
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={displayLogs.length === 0}
              className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                exportOpen
                  ? "text-zinc-200 border-zinc-600 bg-zinc-800"
                  : "text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            {exportOpen && (
              <ExportMenu
                logs={displayLogs}
                onClose={() => setExportOpen(false)}
              />
            )}
          </div>

          {/* Clear */}
          {displayLogs.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-red-500/20 hover:bg-red-500/5"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ══ FILTERS ══ */}
      <div className="px-3 py-2 border-b border-zinc-800 flex flex-col gap-2 shrink-0">
        {/* Direction toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {(["all", "out", "in"] as const).map((d) => {
            const conf = DIRECTION_CONFIG[d];
            const isActive = direction === d;
            return (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-medium px-2 py-1.5 rounded-md transition-all duration-150 border ${
                  isActive
                    ? conf.activeClass
                    : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {conf.icon}
                {conf.label}
              </button>
            );
          })}
        </div>

        {/* Live search */}
        <div
          className={`flex items-center gap-2 bg-zinc-900 border rounded-lg px-3 h-8 transition-all ${
            regexError
              ? "border-red-500/60 shadow-[0_0_0_2px_rgba(239,68,68,0.08)]"
              : searchFocus
                ? "border-zinc-500"
                : debouncedFilter
                  ? "border-zinc-600"
                  : "border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <Search
            className={`w-3 h-3 shrink-0 transition-colors ${searchFocus ? "text-zinc-400" : "text-zinc-700"}`}
          />
          <input
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="live regex filter…"
            className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-700"
          />
          {filterInput && (
            <button
              onClick={() => setFilterInput("")}
              className="text-zinc-600 hover:text-zinc-300 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {regexError && (
          <p className="text-[10px] text-red-400 flex items-center gap-1">
            <X className="w-2.5 h-2.5" />
            Invalid regex
          </p>
        )}
      </div>

      {/* ══ SCROLLABLE LOG ══
          flex-1   — takes all remaining vertical space
          min-h-0  — CRITICAL: lets flex child shrink below content height,
                     enabling scroll instead of viewport overflow
          overflow-y-auto — the actual scroll
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(113,119,144,0.5)_rgba(39,39,42,0.5)]">
        {filteredLogs.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : (
          <>
            {pinnedLogs.length > 0 && (
              <>
                <PinnedSeparator count={pinnedLogs.length} />
                {pinnedLogs.map((log) => (
                  <LogEntry
                    key={`p-${log.id}`}
                    log={log}
                    isExpanded={expanded.has(log.id)}
                    isAckExpanded={expandedAck.has(log.id)}
                    isPinned
                    tsMode={tsMode}
                    onToggle={() => toggle(log.id)}
                    onToggleAck={() => toggleAck(log.id)}
                    onTogglePin={() => togglePin(log.id)}
                    onFilterByEvent={filterByEvent}
                  />
                ))}
                {streamLogs.length > 0 && <StreamSeparator />}
              </>
            )}
            {streamLogs.map((log) => (
              <LogEntry
                key={log.id}
                log={log}
                isExpanded={expanded.has(log.id)}
                isAckExpanded={expandedAck.has(log.id)}
                isPinned={false}
                tsMode={tsMode}
                onToggle={() => toggle(log.id)}
                onToggleAck={() => toggleAck(log.id)}
                onTogglePin={() => togglePin(log.id)}
                onFilterByEvent={filterByEvent}
              />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <BufferBar count={displayLogs.length} />
    </div>
  );
}
