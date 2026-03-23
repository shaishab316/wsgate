/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useEffect, useState, useRef } from 'react';
import {
  Radio,
  Send,
  Search,
  X,
  Sparkles,
  Keyboard,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useWsgateStore } from '@/store/wsgate.store';
import { useSocketStore } from '@/hooks/useSocket';
import type { WsEvent, WsEventsResponse } from '@/types/ws-event';
import { NamespaceBar } from './sub-components/NamespaceBar';
import {
  filterEvents,
  getUniqueNamespaces,
  groupByNamespaceThenGateway,
  namespaceColor,
} from '@/lib/utils';
import { SidebarShimmerList } from './shimmer/SidebarShimmerList';
import { ErrorState } from './sub-components/ErrorState';
import { EmptySearch } from './sub-components/EmptySearch';
import { NamespaceSectionHeader } from './sub-components/NamespaceSectionHeader';
import { GatewayHeader } from './sub-components/GatewayHeader';
import { EventRow } from './sub-components/EventRow';

/**
 * Sidebar component for the WebSocket Gateway UI.
 *
 * Displays a hierarchical list of WebSocket events organized by namespace and gateway.
 * Provides search, filtering, and namespace selection capabilities.
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

  const [events, setEvents] = useState<WsEvent[]>([]);
  const [title, setTitle] = useState('nestjs-wsgate');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeNamespace, setActiveNamespace] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);

  // ── Keyboard shortcuts ────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K (or Cmd+K) to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowKeyboardHint(false);
      }
      // Escape to clear search when focused
      if (
        e.key === 'Escape' &&
        search &&
        document.activeElement === searchInputRef.current
      ) {
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        setTitle(data.title ?? 'nestjs-wsgate');
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
    const payload: WsEventsResponse = { title, events };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'events.json';
    a.click();
    URL.revokeObjectURL(href);
  }

  // ── Derived — filtered + grouped ─────────────────────

  const namespaces = getUniqueNamespaces(events);
  const filtered = filterEvents(events, search);
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
    const eventNamespace = event.namespace ?? '/';
    const isConnected = status === 'connected';

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
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex flex-col leading-none flex-1 min-w-0">
            <h1 className="text-sm font-bold text-zinc-100 truncate flex items-center gap-2">
              {title}
              {!loading && !error && (
                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready
                </span>
              )}
            </h1>
          </div>

          {/* Total event count */}
          {events.length > 0 && (
            <Badge
              variant="outline"
              className="shrink-0 border-zinc-700 text-zinc-500 text-[10px] h-5 px-1.5 bg-zinc-900/50"
            >
              {events.length}
            </Badge>
          )}

          {/* Export events.json */}
          {!loading && !error && events.length > 0 && (
            <button
              onClick={handleExport}
              title="Export events.json"
              className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-800/50 rounded"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Search input — only shown when events are loaded ── */}
      {!loading && !error && events.length > 0 && (
        <div className="px-3 py-2 border-b border-zinc-800 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div
              className={`flex items-center gap-2 h-8 bg-zinc-900 border rounded-lg px-3 transition-all duration-200 ${
                search
                  ? 'border-blue-500/50 shadow-[0_0_0_2px_rgba(59,130,246,0.08)]'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Search className="w-3 h-3 text-zinc-600 shrink-0" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="flex-1 min-w-0 bg-transparent text-xs font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Keyboard hint */}
            {showKeyboardHint && events.length > 0 && (
              <div className="flex items-center justify-between px-2 py-1 text-[9px] text-zinc-600">
                <div className="flex items-center gap-1">
                  <Keyboard className="w-3 h-3" />
                  <span>Press</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[8px]">
                    Ctrl+K
                  </kbd>
                  <span>to search</span>
                </div>
                <button
                  onClick={() => setShowKeyboardHint(false)}
                  className="hover:text-zinc-400 transition-colors"
                >
                  <X className="w-3 h-3" />
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
          allEvents={events}
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
          <EmptySearch onClear={() => setSearch('')} />
        )}

        {/* No events loaded yet */}
        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-12 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-zinc-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-zinc-300">
                No events discovered
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
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
                    <div className="border-l border-zinc-800/40 ml-0 pl-3">
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
      {!loading && !error && events.length > 0 && (
        <div className="px-4 py-2.5 border-t border-zinc-800 shrink-0 flex items-center gap-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Send className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-[10px] text-zinc-600">
              {events.filter((e) => e.type === 'emit').length} emit
            </span>
          </div>
          <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Radio className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[10px] text-zinc-600">
              {events.filter((e) => e.type === 'subscribe').length} subscribe
            </span>
          </div>
          {/* Active namespace indicator */}
          {activeNamespace && (
            <>
              <div className="flex-1" />
              <button
                onClick={() => setActiveNamespace(null)}
                title="Clear namespace filter"
                className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors group px-2 py-1 rounded hover:bg-zinc-800/50"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    namespaceColor(activeNamespace, namespaces).dot
                  }`}
                />
                {activeNamespace}
                <X className="w-2.5 h-2.5 text-zinc-700 group-hover:text-zinc-400 transition-colors ml-0.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
