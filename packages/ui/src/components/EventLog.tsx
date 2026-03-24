/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import {
  ArrowDown,
  ArrowUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  Lock,
  Pause,
  Pin,
  Play,
  ScrollText,
  Search,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { type Log, useWsgateStore } from "@/store/wsgate.store";
import { BufferBar } from "./sub-components/BufferBar";
import { DIRECTION_CONFIG } from "./sub-components/Config";
import { ExportMenu } from "./sub-components/ExportMenu";
import { IconBtn } from "./sub-components/IconBtn";
import { LogEmptyState } from "./sub-components/LogEmptyState";
import { LogEntry } from "./sub-components/LogEntry";
import { PinnedSeparator } from "./sub-components/PinnedSeparator";
import { StreamSeparator } from "./sub-components/StreamSeparator";

type DirectionFilter = "all" | "in" | "out";

/**
 * EventLog component for displaying and managing WebSocket gateway events.
 *
 * Provides comprehensive event logging with features including:
 * - Live/paused mode for event stream capture
 * - Real-time regex filtering with debouncing
 * - Directional filtering (incoming/outgoing/all)
 * - Event pinning and expansion controls
 * - Auto-scroll with lock functionality
 * - Absolute/relative timestamp display modes
 * - Event export and clear operations
 * - Event counter statistics
 *
 * @component
 *
 * @state {Log[]} displayLogs - Currently displayed logs (live or paused snapshot)
 * @state {boolean} paused - Whether the event stream is paused
 * @state {number} pendingCount - Number of new events while paused
 * @state {Set<number>} expanded - IDs of expanded log entries
 * @state {Set<number>} expandedAck - IDs of expanded acknowledgment details
 * @state {Set<number>} pinnedIds - IDs of pinned log entries
 * @state {string} filterInput - Current filter input value
 * @state {DirectionFilter} direction - Filter direction ("all", "in", "out")
 * @state {boolean} searchFocus - Whether search input has focus
 * @state {boolean} autoScroll - Whether to auto-scroll to latest entry
 * @state {TimestampMode} tsMode - Timestamp display mode ("absolute" or "relative")
 * @state {boolean} exportOpen - Whether export menu is open
 *
 * @example
 * ```tsx
 * <EventLog />
 * ```
 *
 * @returns {JSX.Element} The event log UI container with header, filters, and log entries
 */
export default function EventLog() {
  const { logs: storeLogs, clearLogs } = useWsgateStore();

  // ── Live / Paused ─────────────────────────────────────
  const [paused, setPaused] = useState(false);
  const [displayLogs, setDisplayLogs] = useState<Log[]>(storeLogs);
  const [pendingCount, setPendingCount] = useState(0);
  const pausedRef = useRef<Log[]>([]);

  useEffect(() => {
    if (!paused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: explicitly only want to trigger on displayLogs, autoScroll, or paused changes
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
          <ScrollText className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="text-base font-bold text-zinc-50 shrink-0">
            Event Log
          </h2>

          {displayLogs.length > 0 && (
            <Badge
              variant="outline"
              className="text-[11px] border-zinc-600 text-zinc-300 px-2 h-5 shrink-0 font-medium"
            >
              {filteredLogs.length}/{displayLogs.length}
            </Badge>
          )}

          {paused && pendingCount > 0 && (
            <span className="text-[10px] font-mono font-semibold text-amber-300 border border-amber-500/50 bg-amber-500/15 rounded-md px-2 py-0.5 shrink-0 animate-pulse">
              +{pendingCount} pending
            </span>
          )}

          <div className="flex-1" />

          {/* Inline stats */}
          {displayLogs.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1.5">
                <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-medium text-blue-300">
                  {outCount} out
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-300">
                  {inCount} in
                </span>
              </span>
              {pinnedIds.size > 0 && (
                <span className="flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-medium text-amber-300">
                    {pinnedIds.size} pinned
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Row 2 — toolbar */}
        <div className="flex items-center gap-1 flex-wrap">
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
            type="button"
            onClick={paused ? handleResume : handlePause}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              paused
                ? "text-amber-300 border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/25"
                : "text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-700"
            }`}
          >
            {paused ? (
              <>
                <Play className="w-3.5 h-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            )}
          </button>

          {/* Export */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              disabled={displayLogs.length === 0}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                exportOpen
                  ? "text-zinc-100 border-cyan-600/50 bg-cyan-500/15"
                  : "text-zinc-400 border-zinc-700 hover:text-cyan-300 hover:border-cyan-600/30 hover:bg-cyan-500/10"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
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
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-red-500/40 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ══ FILTERS ══ */}
      <div className="px-3 py-2 border-b border-zinc-800 flex flex-col gap-2 shrink-0">
        {/* Direction toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg p-1">
          {(["all", "out", "in"] as const).map((d) => {
            const conf = DIRECTION_CONFIG[d];
            const isActive = direction === d;
            return (
              <button
                type="button"
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold px-2 py-2 rounded-md transition-all duration-150 border ${
                  isActive
                    ? conf.activeClass
                    : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800"
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
          className={`flex items-center gap-2 bg-zinc-900 border rounded-lg px-3 h-9 transition-all ${
            regexError
              ? "border-red-500/60 shadow-[0_0_0_2px_rgba(239,68,68,0.1)]"
              : searchFocus
                ? "border-violet-500/60 shadow-[0_0_0_2px_rgba(139,92,246,0.08)]"
                : debouncedFilter
                  ? "border-zinc-600"
                  : "border-zinc-700 hover:border-zinc-600"
          }`}
        >
          <Search
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${searchFocus ? "text-violet-400" : "text-zinc-600"}`}
          />
          <input
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="live regex filter…"
            className="flex-1 min-w-0 bg-transparent text-[12px] font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600"
          />
          {filterInput && (
            <button
              type="button"
              onClick={() => setFilterInput("")}
              className="text-zinc-500 hover:text-zinc-200 shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {regexError && (
          <p className="text-[11px] font-medium text-red-400 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" />
            Invalid regex
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(113,119,144,0.5)_rgba(39,39,42,0.5)]">
        {filteredLogs.length === 0 ? (
          <LogEmptyState hasFilter={hasFilter} />
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
                    tsMode={"absolute"}
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
                tsMode={"absolute"}
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
