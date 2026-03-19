/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useEffect, useState } from "react";
import {
  Radio,
  Send,
  RefreshCw,
  Zap,
  Search,
  X,
  AlertTriangle,
  ServerCrash,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWsgateStore } from "@/store/wsgate.store";
import type { WsEvent, WsEventsResponse } from "@/types/ws-event";

// ── Badge config ──────────────────────────────────────

/**
 * Visual configuration for each event type badge.
 */
const TYPE_CONFIG: Record<
  "emit" | "subscribe",
  { className: string; icon: React.ReactNode; label: string }
> = {
  emit: {
    className: "border-blue-500/40 text-blue-400 bg-blue-500/5",
    icon: <Send className="w-2.5 h-2.5" />,
    label: "emit",
  },
  subscribe: {
    className: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
    icon: <Radio className="w-2.5 h-2.5" />,
    label: "sub",
  },
};

// ── Shimmer skeleton ──────────────────────────────────

/**
 * Renders a list of shimmer placeholder items
 * while the events are being fetched.
 */
function ShimmerList() {
  return (
    <div className="flex flex-col py-2 px-2 gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg">
          {/* Icon + event name + badge row */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-zinc-800 animate-pulse shrink-0" />
            <div
              className="h-3 rounded bg-zinc-800 animate-pulse flex-1"
              style={{ width: `${45 + (i % 3) * 15}%` }}
            />
            <div className="h-4 w-10 rounded-full bg-zinc-800 animate-pulse shrink-0" />
          </div>

          {/* Description row */}
          <div
            className="h-2.5 rounded bg-zinc-800/60 animate-pulse ml-6"
            style={{ width: `${55 + (i % 2) * 20}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Error state ───────────────────────────────────────

/**
 * Renders a detailed error state with icon, title, description,
 * and a retry button.
 *
 * @param url     - The URL that failed to load.
 * @param onRetry - Callback to retry the fetch.
 */
function ErrorState({ url, onRetry }: { url: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 gap-5 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ServerCrash className="w-7 h-7 text-red-400" />
        </div>
        {/* pulse ring */}
        <div className="absolute inset-0 rounded-2xl border border-red-500/20 animate-ping" />
      </div>

      {/* Title + description */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-zinc-100">
          Failed to load events
        </p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Could not reach the events endpoint.
          <br />
          Make sure the server is running.
        </p>
      </div>

      {/* URL that failed */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2">
        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
        <p className="text-xs font-mono text-red-400 truncate">
          {url}/wsgate/events.json
        </p>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-lg px-4 py-2 transition-all duration-200 group"
      >
        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
        Retry
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────

/**
 * Shown when events load successfully but none match the search query.
 *
 * @param query   - The current search string.
 * @param onClear - Clears the search input.
 */
function EmptySearch({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 gap-3 text-center">
      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <Search className="w-4 h-4 text-zinc-600" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-zinc-400">No results</p>
        <p className="text-xs text-zinc-600">
          No events match{" "}
          <span className="font-mono text-zinc-500">"{query}"</span>
        </p>
      </div>
      <button
        onClick={onClear}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
      >
        Clear search
      </button>
    </div>
  );
}

// ── Gateway group header ───────────────────────────────

/**
 * Collapsible section header for grouping events by gateway name.
 *
 * @param name       - The gateway class name.
 * @param count      - Number of events in this group.
 * @param collapsed  - Whether the section is collapsed.
 * @param onToggle   - Toggles collapsed state.
 */
function GatewayHeader({
  name,
  count,
  collapsed,
  onToggle,
}: {
  name: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-1.5 mt-2 group"
    >
      <Layers className="w-3 h-3 text-zinc-600 shrink-0" />
      <span className="flex-1 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-widest truncate">
        {name}
      </span>
      <Badge
        variant="outline"
        className="text-[9px] border-zinc-700 text-zinc-600 px-1.5 h-4"
      >
        {count}
      </Badge>
      <ChevronRight
        className={`w-3 h-3 text-zinc-600 transition-transform duration-200 ${
          collapsed ? "" : "rotate-90"
        }`}
      />
    </button>
  );
}

// ── Component ─────────────────────────────────────────

/**
 * Left sidebar panel for the nestjs-wsgate UI.
 *
 * Fetches discovered `@WsDoc()` events from `{url}/wsgate/events.json`.
 * Shows a shimmer skeleton while loading and a detailed error
 * state with retry on failure.
 *
 * Features:
 * - Live search filter across event names and descriptions
 * - Events grouped by gateway name with collapsible sections
 * - Emit vs Subscribe badge with matching icon
 * - Total event count in header
 *
 * Selected event is persisted via Zustand store.
 */
export default function Sidebar() {
  // ── Stores ────────────────────────────────────────────

  const { url, selectedEvent, setSelectedEvent } = useWsgateStore();

  // ── Local state ───────────────────────────────────────

  const [events, setEvents] = useState<WsEvent[]>([]);
  const [title, setTitle] = useState("nestjs-wsgate");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // ── Fetch events ──────────────────────────────────────

  /**
   * Fetches event metadata from `{url}/wsgate/events.json`.
   * Re-fetches whenever the store URL changes.
   */
  function fetchEvents() {
    if (!url) return;

    setLoading(true);
    setError(false);

    fetch(`${url}/wsgate/events.json`)
      .then((res) => res.json() as Promise<WsEventsResponse>)
      .then((data) => {
        setEvents(data.events);
        setTitle(data.title);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchEvents();
  }, [url]);

  // ── Derived — search + grouping ───────────────────────

  /**
   * Filters events by the current search query (event name or description),
   * then groups them by `gatewayName` for section rendering.
   */
  const filtered = search.trim()
    ? events.filter(
        (e) =>
          e.event.toLowerCase().includes(search.toLowerCase()) ||
          e.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : events;

  const grouped = filtered.reduce<Record<string, WsEvent[]>>((acc, event) => {
    const key = event.gatewayName ?? "Default";
    (acc[key] ??= []).push(event);
    return acc;
  }, {});

  // ── Handlers ──────────────────────────────────────────

  /**
   * Toggles the collapsed state of a gateway group section.
   *
   * @param name - The gateway name to toggle.
   */
  function toggleCollapse(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>

          <div className="flex flex-col leading-none flex-1 min-w-0">
            <h1 className="text-sm font-bold text-zinc-100 truncate">
              {title}
            </h1>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Socket.IO Explorer
            </p>
          </div>

          {/* Total event count */}
          {events.length > 0 && (
            <Badge
              variant="outline"
              className="shrink-0 border-zinc-700 text-zinc-500 text-[10px] h-5 px-1.5"
            >
              {events.length}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Search input ── */}
      {!loading && !error && events.length > 0 && (
        <div className="px-3 py-2 border-b border-zinc-800 shrink-0">
          <div
            className={`flex items-center gap-2 h-8 bg-zinc-900 border rounded-lg px-3 transition-all duration-200 ${
              search
                ? "border-blue-500/50 shadow-[0_0_0_2px_rgba(59,130,246,0.08)]"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <Search className="w-3 h-3 text-zinc-600 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="flex-1 min-w-0 bg-transparent text-xs font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {/* Loading — shimmer skeleton */}
        {loading && <ShimmerList />}

        {/* Error state */}
        {!loading && error && <ErrorState url={url} onRetry={fetchEvents} />}

        {/* Empty search result */}
        {!loading && !error && filtered.length === 0 && search && (
          <EmptySearch query={search} onClear={() => setSearch("")} />
        )}

        {/* Grouped event list */}
        {!loading && !error && (
          <div className="py-2">
            {Object.entries(grouped).map(([gatewayName, gatewayEvents]) => {
              const isCollapsed = collapsed.has(gatewayName);

              return (
                <div key={gatewayName}>
                  {/* Gateway section header */}
                  <GatewayHeader
                    name={gatewayName}
                    count={gatewayEvents.length}
                    collapsed={isCollapsed}
                    onToggle={() => toggleCollapse(gatewayName)}
                  />

                  {/* Events in this gateway */}
                  {!isCollapsed && (
                    <div className="mt-0.5 px-2">
                      {gatewayEvents.map((event) => {
                        const isSelected =
                          selectedEvent?.event === event.event &&
                          selectedEvent?.type === event.type;
                        const typeConf = TYPE_CONFIG[event.type];

                        return (
                          <button
                            key={`${event.gatewayName}:${event.event}:${event.type}`}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-1 transition-all duration-150 mb-0.5 group border ${
                              isSelected
                                ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
                                : "border-transparent hover:bg-zinc-800/60 hover:border-zinc-700/50"
                            }`}
                          >
                            {/* Event name + type badge */}
                            <div className="flex items-center gap-2">
                              {/* Type icon dot */}
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
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer — emit/subscribe legend ── */}
      {!loading && !error && events.length > 0 && (
        <div className="px-4 py-2.5 border-t border-zinc-800 shrink-0 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Send className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-[10px] text-zinc-600">
              {events.filter((e) => e.type === "emit").length} emit
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[10px] text-zinc-600">
              {events.filter((e) => e.type === "subscribe").length} subscribe
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
