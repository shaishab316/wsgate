/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import {
  Download,
  Keyboard,
  Radio,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useSocketStore } from "@/hooks/useSocket";
import {
  filterEvents,
  getUniqueNamespaces,
  groupByNamespaceThenGateway,
  namespaceColor,
} from "@/lib/utils";
import { useWsgateStore } from "@/store/wsgate.store";
import type { WsEvent, WsEventsResponse } from "@/types/ws-event";
import { SidebarShimmerList } from "./shimmer/SidebarShimmerList";
import { EmptySearch } from "./sub-components/EmptySearch";
import { ErrorState } from "./sub-components/ErrorState";
import { EventRow } from "./sub-components/EventRow";
import { GatewayHeader } from "./sub-components/GatewayHeader";
import { NamespaceBar } from "./sub-components/NamespaceBar";
import { NamespaceSectionHeader } from "./sub-components/NamespaceSectionHeader";

/**
 * Sidebar component for the WebSocket Gateway UI.
 *
 * Displays a hierarchical list of WebSocket events organized by namespace and gateway.
 * Provides search, filtering, namespace selection, and event management capabilities.
 * Fully keyboard accessible with shortcuts and screen reader support.
 *
 * @accessibility
 * - Keyboard shortcuts: Ctrl+K (Cmd+K on Mac) to focus search, Escape to clear search
 * - All buttons have aria-labels and title attributes
 * - Search input with clear visual focus indicators
 * - Event rows are keyboard selectable with Enter/Space keys
 * - Proper heading hierarchy with semantic HTML
 * - Screen reader announcements for event counts and status
 * - Focus management throughout the component hierarchy
 *
 * @component
 *
 * @returns {JSX.Element} The rendered sidebar with:
 *   - Header showing title and connection status
 *   - Search input with keyboard shortcuts (Ctrl+K)
 *   - Namespace filter bar for multi-namespace filtering
 *   - Grouped event list (namespace → gateway → events)
 *   - Footer with event type statistics and active namespace indicator
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 *
 * @remarks
 * - Events are fetched from `{targetUrl}/wsgate/events.json`
 * - Selecting an event in a different namespace automatically disconnects the socket
 * - Sections (namespaces and gateways) can be collapsed/expanded
 * - Search filters events in real-time across all fields
 * - Keyboard shortcuts: Ctrl+K to focus search, Escape to clear search
 * - Export functionality allows offline event reference
 * - File upload supports recovery when server is unreachable
 */
export default function Sidebar() {
  // ── Stores ────────────────────────────────────────────

  const {
    url,
    base,
    selectedEvent,
    selectedNamespace,
    setSelectedEvent,
    setSelectedNamespace,
    setAvailableNamespaces,
  } = useWsgateStore();
  const { status, disconnect } = useSocketStore();

  // ── Local state ───────────────────────────────────────

  const [events, setEvents] = useState<WsEvent[] | null>([]);
  const [title, setTitle] = useState("nestjs-wsgate");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeNamespace, setActiveNamespace] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);

  // ── Keyboard shortcuts ────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K (or Cmd+K) to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowKeyboardHint(false);
      }
      // Escape to clear search when focused
      if (
        e.key === "Escape" &&
        search &&
        document.activeElement === searchInputRef.current
      ) {
        setSearch("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [search]);

  // ── Fetch events ──────────────────────────────────────

  /**
   * Fetches event metadata from `{targetUrl}/wsgate/events.json`.
   *
   * Accepts an optional `targetUrl` override — used by `ErrorState`
   * so the user can retry with an edited URL without writing to the
   * Zustand store (which would replace the socket connection string).
   *
   * Falls back to the store `url` when no override is provided.
   * Re-fetches automatically whenever the store URL changes.
   *
   * @param targetUrl - Optional URL override for retry attempts.
   */
  function fetchEvents(targetUrl?: string) {
    const target = targetUrl ?? url;
    if (!target) return;

    setLoading(true);
    setError(false);

    fetch(`${target}${base}/events.json`)
      .then((res) => res.json() as Promise<WsEventsResponse>)
      .then((data) => {
        setEvents(data.events);
        setTitle(data.title);
        setActiveNamespace(null); // reset namespace filter on new data
        // Update available namespaces in store
        const uniqueNamespaces = getUniqueNamespaces(data.events);
        setAvailableNamespaces(uniqueNamespaces);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to re-fetch when the URL changes, not when other dependencies (like setAvailableNamespaces) change
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ── File upload ───────────────────────────────────────

  /**
   * Handles manual events.json file upload when server is unreachable.
   * Parses the file client-side and populates the event list directly.
   *
   * @param file - The uploaded .json File object.
   */
  function handleFileUpload(file: File) {
    setLoading(true);
    setError(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as WsEventsResponse;
        setEvents(data.events);
        setTitle(data.title ?? "nestjs-wsgate");
        setActiveNamespace(null);
        setAvailableNamespaces(getUniqueNamespaces(data.events));
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError(true);
      setLoading(false);
    };
    reader.readAsText(file);
  }

  // ── Export events ─────────────────────────────────────

  /**
   * Exports the current events list as a downloadable `events.json` file.
   * Serializes `{ title, events }` to match the WsEventsResponse shape.
   */
  function handleExport() {
    const payload: WsEventsResponse = { title, events: events ?? [] };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "events.json";
    a.click();
    URL.revokeObjectURL(href);
  }

  // ── Derived — filtered + grouped ─────────────────────

  const namespaces = getUniqueNamespaces(events);
  const filtered = filterEvents(events ?? [], search);
  const groupedByNs = groupByNamespaceThenGateway(filtered);

  // If a namespace filter is active, only show that namespace
  const displayedNamespaces = activeNamespace
    ? namespaces.includes(activeNamespace)
      ? [activeNamespace]
      : []
    : namespaces;

  // ── Handlers ──────────────────────────────────────────

  /**
   * Handles event selection from the sidebar.
   * Automatically disconnects the socket if:
   * - The selected event's namespace is DIFFERENT from the current selectedNamespace
   * - AND the socket is currently connected
   * This prevents message routing to wrong namespaces.
   *
   * @param event - The WsEvent that was clicked.
   */
  function handleEventSelect(event: WsEvent) {
    const eventNamespace = event.namespace ?? "/";
    const isConnected = status === "connected";

    // If event is in a DIFFERENT namespace than currently selected AND socket is connected
    if (eventNamespace !== selectedNamespace && isConnected) {
      disconnect();
    }

    setSelectedEvent(event);
    setSelectedNamespace(eventNamespace);
  }

  /**
   * Toggles the collapsed state of a gateway group section.
   *
   * @param name - The gateway name to toggle.
   */
  function toggleCollapse(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      // next.has(name) ? next.delete(name) : next.add(name);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      return next;
    });
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-zinc-600/80 shrink-0 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="flex items-center gap-2">
          <div className="flex flex-col leading-none flex-1 min-w-0">
            <h1 className="text-base font-bold text-white/95 truncate flex items-center gap-2">
              {title}
              {!loading && !error && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-50 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ready
                </span>
              )}
            </h1>
          </div>

          {/* Total event count */}
          {events?.length && (
            <Badge
              variant="outline"
              className="shrink-0 border-zinc-500/50 text-zinc-300 text-xs h-6 px-2 bg-zinc-800/60 font-semibold"
            >
              {events.length}
            </Badge>
          )}

          {/* Export events.json */}
          {!loading && !error && events?.length && (
            <button
              type="button"
              onClick={handleExport}
              aria-label="Export events as JSON file"
              title="Export events.json"
              className="shrink-0 text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-700/70 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Search input — only shown when events are loaded ── */}
      {!loading && !error && events?.length && (
        <div className="px-3 py-2.5 border-b border-zinc-600/80 shrink-0">
          <div className="flex flex-col gap-2">
            <div
              className={`flex items-center gap-2 h-9 bg-zinc-900/80 border rounded-lg px-3 transition-all duration-200 backdrop-blur-sm ${
                search
                  ? "border-blue-500/80 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]"
                  : "border-zinc-600 hover:border-zinc-500"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                aria-label="Search events by name or description"
                className="flex-1 min-w-0 bg-transparent text-sm font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  title="Clear search (Esc)"
                  className="shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Keyboard hint */}
            {showKeyboardHint && events.length > 0 && (
              <div className="flex items-center justify-between px-2 py-1 text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Press</span>
                  <kbd className="px-2 py-1 rounded bg-zinc-700/70 text-zinc-200 font-mono text-xs border border-zinc-600">
                    Ctrl+K
                  </kbd>
                  <span>to search</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyboardHint(false)}
                  className="hover:text-zinc-200 transition-colors p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Namespace filter bar — only shown when multiple namespaces exist ── */}
      {!loading && !error && (
        <NamespaceBar
          namespaces={namespaces}
          active={activeNamespace}
          allEvents={events ?? []}
          onSelect={setActiveNamespace}
        />
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Loading — shimmer skeleton */}
        {loading && <SidebarShimmerList />}

        {/* Error state — passes editUrl to fetchEvents, never to setUrl */}
        {!loading && error && (
          <ErrorState
            url={url}
            onRetry={(editedUrl) => fetchEvents(editedUrl)}
            onFileUpload={handleFileUpload}
          />
        )}

        {/* Empty search result */}
        {!loading && !error && filtered.length === 0 && search && (
          <EmptySearch onClear={() => setSearch("")} />
        )}

        {/* No events loaded yet */}
        {!loading && !error && !events?.length && (
          <div className="flex flex-col items-center justify-center px-5 py-12 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-zinc-700/60 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-400/80" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-zinc-100">
                No events discovered
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Make sure your NestJS server is running and WsgateModule is
                imported
              </p>
            </div>
          </div>
        )}

        {/* Grouped event list — by namespace then gateway */}
        {!loading && !error && filtered.length > 0 && (
          <div className="py-2">
            {displayedNamespaces.map((ns) => {
              const nsColor = namespaceColor(ns, namespaces);
              const nsKey = `ns:${ns}`;
              const nsExpanded = !collapsed.has(nsKey);
              const gwInNs = groupedByNs[ns] || {};
              const nsEventCount = Object.values(gwInNs).reduce(
                (sum, gw) => sum + gw.length,
                0,
              );

              return (
                <div key={nsKey}>
                  {/* Namespace section header */}
                  <NamespaceSectionHeader
                    ns={ns}
                    count={nsEventCount}
                    color={nsColor}
                    isExpanded={nsExpanded}
                    onToggle={() => toggleCollapse(nsKey)}
                  />

                  {/* Gateways in this namespace */}
                  {nsExpanded && (
                    <div className="border-l border-zinc-700/50 ml-0 pl-3">
                      {Object.entries(gwInNs).map(([gatewayName, gwEvents]) => {
                        const gwKey = `gw:${ns}:${gatewayName}`;
                        const gwCollapsed = collapsed.has(gwKey);

                        return (
                          <div key={gwKey}>
                            {/* Gateway section header */}
                            <GatewayHeader
                              name={gatewayName}
                              count={gwEvents.length}
                              collapsed={gwCollapsed}
                              onToggle={() => toggleCollapse(gwKey)}
                            />

                            {/* Events in this gateway */}
                            {!gwCollapsed && (
                              <div className="mt-0.5 px-2">
                                {gwEvents.map((event) => (
                                  <EventRow
                                    key={`${event.gatewayName}:${event.event}:${event.type}`}
                                    event={event}
                                    isSelected={
                                      selectedEvent?.event === event.event &&
                                      selectedEvent?.type === event.type &&
                                      selectedEvent?.namespace ===
                                        event.namespace
                                    }
                                    onSelect={() => handleEventSelect(event)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
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

      {/* ── Footer — emit / subscribe legend + active namespace ── */}
      {!loading && !error && events?.length && (
        <div className="px-4 py-3 border-t border-zinc-600/80 shrink-0 flex items-center gap-4 bg-gradient-to-t from-zinc-950 to-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-default">
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-zinc-300 font-medium">
              {events.filter((e) => e.type === "emit").length} emit
            </span>
          </div>
          <div className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-default">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-zinc-300 font-medium">
              {events.filter((e) => e.type === "subscribe").length} subscribe
            </span>
          </div>
          {/* Active namespace indicator */}
          {activeNamespace && (
            <>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setActiveNamespace(null)}
                title="Clear namespace filter"
                className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white transition-colors group px-2.5 py-1.5 rounded hover:bg-zinc-700/60 border border-zinc-600/50"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    namespaceColor(activeNamespace, namespaces).dot
                  }`}
                />
                {activeNamespace}
                <X className="w-3 h-3 text-zinc-500 group-hover:text-zinc-200 transition-colors ml-0.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
