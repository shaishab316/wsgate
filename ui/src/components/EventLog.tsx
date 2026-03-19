/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useRef, useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Editor from "@monaco-editor/react";
import { useWsgateStore, type Log } from "@/store/wsgate.store";

// ── Types ─────────────────────────────────────────────

/**
 * Direction filter options for the event log.
 * - `all`  — show all events
 * - `out`  — show only client → server events (↑)
 * - `in`   — show only server → client events (↓)
 */
type DirectionFilter = "all" | "in" | "out";

// ── Helpers ───────────────────────────────────────────

/**
 * Calculates the Monaco editor height for a given log payload.
 * Caps at 200px to keep the log compact.
 *
 * @param data - The payload to measure.
 * @returns A CSS height string (e.g. `'120px'`).
 */
function getEditorHeight(data: unknown): string {
  try {
    const lines = JSON.stringify(data, null, 2).split("\n").length;
    return `${Math.min(lines * 18 + 24, 200)}px`;
  } catch {
    return "80px";
  }
}

// ── Constants ─────────────────────────────────────────

/**
 * Monaco editor options for the payload viewer.
 * Read-only, compact, no decorations.
 */
const LOG_EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 12,
  fontFamily: "JetBrains Mono, Fira Code, monospace",
  lineNumbers: "off" as const,
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  folding: false,
  renderLineHighlight: "none" as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: { vertical: "hidden" as const, horizontal: "hidden" as const },
  padding: { top: 8, bottom: 8 },
  contextmenu: false,
};

/**
 * Direction filter config — icon, label, and active style per option.
 */
const DIRECTION_CONFIG = {
  all: {
    icon: <ArrowUpDown className="w-3 h-3" />,
    label: "All",
    activeClass: "bg-zinc-700 text-zinc-100",
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

// ── Sub-components ────────────────────────────────────

/**
 * Empty state shown when there are no log entries
 * or no entries match the current filter.
 *
 * @param hasFilter - Whether a filter or direction is active.
 */
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
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

// ─────────────────────────────────────────────────────

/**
 * Single log entry row with expandable payload viewer.
 *
 * @param log       - The log entry to render.
 * @param isExpanded - Whether the payload is currently expanded.
 * @param isCopied  - Whether the payload was just copied.
 * @param onToggle  - Toggles the expanded state.
 * @param onCopy    - Copies the payload to clipboard.
 */
function LogEntry({
  log,
  isExpanded,
  isCopied,
  onToggle,
  onCopy,
}: {
  log: Log;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const isOut = log.direction === "out";
  const hasData = log.data !== undefined && log.data !== null;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-150 ${
        isOut
          ? isExpanded
            ? "border-blue-500/40 bg-blue-500/5 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
            : "border-blue-500/20 bg-blue-500/[0.03] hover:border-blue-500/35 hover:bg-blue-500/5"
          : isExpanded
            ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]"
            : "border-emerald-500/20 bg-emerald-500/[0.03] hover:border-emerald-500/35 hover:bg-emerald-500/5"
      }`}
    >
      {/* ── Log row ── */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        {/* Direction icon */}
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

        {/* Event name */}
        <span
          className={`flex-1 min-w-0 text-xs font-mono font-medium truncate ${
            isOut ? "text-blue-300" : "text-emerald-300"
          }`}
        >
          {log.event}
        </span>

        {/* Timestamp */}
        <span className="text-[10px] text-zinc-600 font-mono shrink-0">
          {log.timestamp}
        </span>

        {/* Expand toggle */}
        {hasData && (
          <span
            className={`shrink-0 transition-colors ${
              isExpanded ? "text-zinc-400" : "text-zinc-700"
            }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>

      {/* ── Expanded payload ── */}
      {isExpanded && hasData && (
        <div className="border-t border-white/5">
          {/* Payload toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-black/20">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
              Payload
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-all duration-150 ${
                isCopied
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                  : "border-zinc-700 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {isCopied ? (
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
          </div>

          {/* Monaco JSON viewer */}
          <Editor
            height={getEditorHeight(log.data)}
            defaultLanguage="json"
            value={JSON.stringify(log.data, null, 2)}
            theme="vs-dark"
            options={LOG_EDITOR_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────

/**
 * Right panel for the nestjs-wsgate UI.
 *
 * Reads logs directly from the Zustand store —
 * no prop drilling required.
 *
 * Displays a live, scrollable log of all Socket.IO events — both
 * emitted by the client (↑) and received from the server (↓).
 *
 * Features:
 * - Direction filter toggle (All / ↑ Out / ↓ In) with icons
 * - Live search filter with regex support
 * - Expandable payload per log entry with Monaco JSON highlighting
 * - Copy payload to clipboard with confirmation flash
 * - Auto-scroll to latest entry when no filter is active
 * - Filtered count badge (e.g. `3/12`)
 * - Extracted `LogEntry` and `EmptyState` sub-components
 */
export default function EventLog() {
  // ── Store ─────────────────────────────────────────────

  const { logs, clearLogs } = useWsgateStore();

  // ── State ────────────────────────────────────────────

  const bottomRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [filterInput, setFilterInput] = useState("");
  const [filter, setFilter] = useState("");
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [searchFocus, setSearchFocus] = useState(false);

  // ── Filtering ─────────────────────────────────────────

  /**
   * Applies both the direction filter and the regex event name filter
   * to produce the final list of visible log entries.
   *
   * Computed with `useMemo` to avoid re-running on every render.
   */
  const { filteredLogs, regexError } = useMemo(() => {
    let result = logs;

    if (direction !== "all") {
      result = result.filter((log) => log.direction === direction);
    }

    if (!filter) return { filteredLogs: result, regexError: false };

    try {
      const regex = new RegExp(filter, "i");
      return {
        filteredLogs: result.filter((log) => regex.test(log.event)),
        regexError: false,
      };
    } catch {
      return { filteredLogs: result, regexError: true };
    }
  }, [filter, logs, direction]);

  // ── Auto-scroll ───────────────────────────────────────

  /**
   * Scrolls to the bottom of the log whenever new entries arrive,
   * but only when no filter is active.
   */
  useEffect(() => {
    if (!filter && direction === "all") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, filter, direction]);

  // ── Handlers ──────────────────────────────────────────

  /** Applies the current filter input as the active regex filter. */
  function applyFilter() {
    setFilter(filterInput);
  }

  /** Clears both the filter input and the active filter. */
  function clearFilter() {
    setFilterInput("");
    setFilter("");
  }

  /**
   * Toggles the expanded state of a log entry payload.
   *
   * @param id - The log entry ID to toggle.
   */
  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /**
   * Copies the payload of a log entry to the clipboard.
   * Shows a brief confirmation on the button.
   *
   * @param id   - The log entry ID.
   * @param data - The payload to copy.
   */
  function copyPayload(id: number, data: unknown) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  // ── Derived ───────────────────────────────────────────

  const hasFilter = !!(filter || direction !== "all");
  const outCount = logs.filter((l) => l.direction === "out").length;
  const inCount = logs.filter((l) => l.direction === "in").length;

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-3.5 h-3.5 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-100">Event Log</h2>

            {/* Filtered / total count badge */}
            {logs.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] border-zinc-700 text-zinc-500 px-1.5 h-4"
              >
                {filteredLogs.length}/{logs.length}
              </Badge>
            )}
          </div>

          {/* Clear button */}
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-500/5 border border-transparent hover:border-red-500/20"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Out / In counters */}
        {logs.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-2.5 h-2.5 text-blue-400" />
              <span className="text-[10px] text-zinc-600">{outCount} out</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDown className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[10px] text-zinc-600">{inCount} in</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Direction filter + search ── */}
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

        {/* Regex search input */}
        <div className="flex gap-1.5">
          <div
            className={`flex items-center gap-2 bg-zinc-900 border rounded-lg px-3 h-8 flex-1 transition-all duration-200 ${
              regexError
                ? "border-red-500/60 shadow-[0_0_0_2px_rgba(239,68,68,0.08)]"
                : searchFocus
                  ? "border-zinc-500 shadow-[0_0_0_2px_rgba(255,255,255,0.04)]"
                  : filter
                    ? "border-zinc-600"
                    : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <Search
              className={`w-3 h-3 shrink-0 transition-colors ${
                searchFocus ? "text-zinc-400" : "text-zinc-700"
              }`}
            />
            <input
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="regex filter by event name"
              className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-700"
            />
            {filterInput && (
              <button
                onClick={clearFilter}
                className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={applyFilter}
            className="shrink-0 h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium transition-colors border border-zinc-700 hover:border-zinc-600"
          >
            Apply
          </button>
        </div>

        {/* Regex error */}
        {regexError && (
          <p className="text-[10px] text-red-400 px-1 flex items-center gap-1">
            <X className="w-2.5 h-2.5" />
            Invalid regex pattern
          </p>
        )}
      </div>

      {/* ── Log entries ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-0">
        {filteredLogs.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : (
          filteredLogs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              isExpanded={expanded.has(log.id)}
              isCopied={copied === log.id}
              onToggle={() => toggleExpand(log.id)}
              onCopy={() => copyPayload(log.id, log.data)}
            />
          ))
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
