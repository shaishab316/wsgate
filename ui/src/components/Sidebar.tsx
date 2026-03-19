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
  ServerCrash,
  Layers,
  ChevronRight,
  Server,
  Network,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWsgateStore } from "@/store/wsgate.store";
import { useSocketStore } from "@/hooks/useSocket";
import type { WsEvent, WsEventsResponse } from "@/types/ws-event";

// ── Constants ─────────────────────────────────────────

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

// ── Namespace color palette ────────────────────────────

/**
 * Color tokens for namespace filter pills.
 * The root namespace `'/'` always maps to the first (zinc) entry.
 * All other namespaces are assigned by their sorted position.
 *
 * Each entry exposes:
 * - `dot`    — filled dot indicator inside the pill
 * - `idle`   — unselected pill appearance
 * - `active` — selected pill appearance
 */
const NAMESPACE_PALETTE = [
  {
    dot: "bg-zinc-500",
    idle: "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
    active: "border-zinc-500 text-zinc-200 bg-zinc-800",
  },
  {
    dot: "bg-blue-400",
    idle: "border-blue-500/25 text-blue-500/80 hover:border-blue-500/50 hover:text-blue-400",
    active: "border-blue-400/60 text-blue-300 bg-blue-500/10",
  },
  {
    dot: "bg-purple-400",
    idle: "border-purple-500/25 text-purple-500/80 hover:border-purple-500/50 hover:text-purple-400",
    active: "border-purple-400/60 text-purple-300 bg-purple-500/10",
  },
  {
    dot: "bg-amber-400",
    idle: "border-amber-500/25 text-amber-500/80 hover:border-amber-500/50 hover:text-amber-400",
    active: "border-amber-400/60 text-amber-300 bg-amber-500/10",
  },
  {
    dot: "bg-teal-400",
    idle: "border-teal-500/25 text-teal-500/80 hover:border-teal-500/50 hover:text-teal-400",
    active: "border-teal-400/60 text-teal-300 bg-teal-500/10",
  },
  {
    dot: "bg-pink-400",
    idle: "border-pink-500/25 text-pink-500/80 hover:border-pink-500/50 hover:text-pink-400",
    active: "border-pink-400/60 text-pink-300 bg-pink-500/10",
  },
];

/**
 * Returns the color tokens for a given namespace string.
 *
 * `'/'` always gets the neutral (zinc) slot.
 * All other namespaces are assigned by their position among non-root
 * namespaces (sorted alphabetically), cycling through the palette.
 *
 * @param ns            - The namespace to look up (e.g. `'/admin'`).
 * @param allNamespaces - Full sorted list of unique namespaces.
 */
function namespaceColor(ns: string, allNamespaces: string[]) {
  if (ns === "/") return NAMESPACE_PALETTE[0];
  const others = allNamespaces.filter((n) => n !== "/").sort();
  const idx = others.indexOf(ns);
  return NAMESPACE_PALETTE[1 + (idx % (NAMESPACE_PALETTE.length - 1))];
}

/**
 * Gets a friendly display name for a namespace.
 * Strips leading "/" and capitalizes first letter.
 *
 * @param ns - The namespace string (e.g. `'/chat'`).
 * @returns Friendly display name.
 */
function getNamespaceDisplayName(ns: string): string {
  if (ns === "/") return "Global";
  return ns.slice(1).charAt(0).toUpperCase() + ns.slice(2);
}

/**
 * Extracts unique namespace values from a flat event list and returns
 * them sorted with `'/'` always first.
 *
 * @param events - The full discovered event list.
 * @returns Sorted array of unique namespace strings.
 */
function getUniqueNamespaces(events: WsEvent[]): string[] {
  const set = new Set(events.map((e) => e.namespace ?? "/"));
  const sorted = [...set].filter((n) => n !== "/").sort();
  return set.has("/") ? ["/", ...sorted] : sorted;
}

/**
 * Groups a flat event list by namespace, then by gateway within each namespace.
 * Falls back to `"/"` for namespace and `"Default"` for gateway.
 *
 * @param events - Flat list of discovered WsEvents.
 * @returns Record mapping namespace → (gateway name → events).
 */
function groupByNamespaceThenGateway(
  events: WsEvent[],
): Record<string, Record<string, WsEvent[]>> {
  return events.reduce<Record<string, Record<string, WsEvent[]>>>(
    (parts, event) => {
      const ns = event.namespace ?? "/";
      const gw = event.gatewayName ?? "Default";
      (parts[ns] ??= {})[gw] ??= [];
      parts[ns][gw].push(event);
      return parts;
    },
    {},
  );
}

/**
 * Filters events by a search query across event name and description.
 *
 * @param events - Full event list.
 * @param query  - Search string (case-insensitive).
 * @returns Filtered event list.
 */
function filterEvents(events: WsEvent[], query: string): WsEvent[] {
  if (!query.trim()) return events;
  const lower = query.toLowerCase();
  return events.filter(
    (e) =>
      e.event.toLowerCase().includes(lower) ||
      e.description?.toLowerCase().includes(lower),
  );
}

// ─────────────────────────────────────────────────────

/**
 * Horizontal scrollable filter bar that lets the user isolate events
 * by Socket.IO namespace.
 *
 * Renders an "All" pill followed by one pill per unique namespace.
 * Each pill shows a colored dot, the namespace string, and a small
 * count badge for the number of events in that namespace.
 *
 * Selecting a namespace hides all events from other namespaces.
 * Selecting "All" clears the filter.
 *
 * Only rendered when there are two or more distinct namespaces —
 * there is nothing to filter with a single namespace.
 *
 * @param namespaces  - Sorted unique namespace list (`'/'` always first).
 * @param active      - Currently selected namespace, or `null` for All.
 * @param allEvents   - Full unfiltered event list (used for per-ns counts).
 * @param onSelect    - Called with the selected namespace or `null` for All.
 */
function NamespaceBar({
  namespaces,
  active,
  allEvents,
  onSelect,
}: {
  namespaces: string[];
  active: string | null;
  allEvents: WsEvent[];
  onSelect: (ns: string | null) => void;
}) {
  // Don't render when there is nothing to filter
  if (namespaces.length < 2) return null;

  return (
    <div className="px-3 py-2 border-b border-zinc-800 shrink-0">
      {/* Section label */}
      <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5 flex items-center gap-1">
        <Network className="w-2.5 h-2.5" />
        Namespace
      </p>

      {/* Scrollable pill row — hidden scrollbar for cleanliness */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* "All" pill */}
        <button
          onClick={() => onSelect(null)}
          className={`inline-flex items-center gap-1.5 shrink-0 h-6 px-2.5 rounded-full text-[10px] font-medium border transition-all duration-150 ${
            active === null
              ? "border-blue-400/60 text-blue-300 bg-blue-500/10"
              : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          {active === null && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          )}
          All
          <span
            className={`text-[9px] px-1 rounded-sm font-mono transition-colors ${
              active === null ? "text-blue-400/80" : "text-zinc-600"
            }`}
          >
            {allEvents.length}
          </span>
        </button>

        {/* One pill per namespace */}
        {namespaces.map((ns) => {
          const palette = namespaceColor(ns, namespaces);
          const count = allEvents.filter(
            (e) => (e.namespace ?? "/") === ns,
          ).length;
          const isActive = active === ns;

          return (
            <button
              key={ns}
              onClick={() => onSelect(isActive ? null : ns)}
              className={`inline-flex items-center gap-1.5 shrink-0 h-6 px-2.5 rounded-full text-[10px] font-mono font-medium border transition-all duration-150 ${
                isActive ? palette.active : palette.idle
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-opacity ${palette.dot} ${
                  isActive ? "opacity-100" : "opacity-50"
                }`}
              />
              {ns}
              <span
                className={`text-[9px] px-1 rounded-sm font-mono transition-colors ${
                  isActive ? "opacity-70" : "text-zinc-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShimmerList() {
  return (
    <div className="flex flex-col py-2 px-2 gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg">
          {/* Icon + name + badge */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-zinc-800 animate-pulse shrink-0" />
            <div
              className="h-3 rounded bg-zinc-800 animate-pulse flex-1"
              style={{ width: `${45 + (i % 3) * 15}%` }}
            />
            <div className="h-4 w-10 rounded-full bg-zinc-800 animate-pulse shrink-0" />
          </div>
          {/* Description */}
          <div
            className="h-2.5 rounded bg-zinc-800/60 animate-pulse ml-6"
            style={{ width: `${55 + (i % 2) * 20}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────

/**
 * Interactive error state shown when `{url}/wsgate/events.json` fails.
 *
 * Key design decision — this component does NOT write to the Zustand store.
 * Editing the URL here only affects the events fetch, never the socket
 * connection string. The edited URL is passed directly to `onRetry(url)`
 * so the parent can re-fetch without polluting global state.
 *
 * @param url     - The URL that failed (used as initial input value).
 * @param onRetry - Called with the (possibly edited) URL to re-fetch.
 */
function ErrorState({
  url,
  onRetry,
}: {
  url: string;
  onRetry: (url: string) => void;
}) {
  // ── Local state ─────────────────────────────────────

  const [editUrl, setEditUrl] = useState(url);
  const [retrying, setRetrying] = useState(false);
  const [focused, setFocused] = useState(false);

  /** True when the user has changed the URL from its original value. */
  const isDirty = editUrl !== url;

  // ── Handlers ────────────────────────────────────────

  /**
   * Triggers the retry with a brief spinner delay for visual feedback.
   * Passes `editUrl` directly — never writes to the Zustand store.
   */
  function handleRetry() {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onRetry(editUrl);
    }, 600);
  }

  /** Resets the input back to the original failed URL. */
  function handleReset() {
    setEditUrl(url);
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 gap-5 text-center">
      {/* Icon + pulse ring */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ServerCrash className="w-7 h-7 text-red-400" />
        </div>
        <div className="absolute inset-0 rounded-2xl border border-red-500/20 animate-ping" />
      </div>

      {/* Title + hint */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-zinc-100">Could not connect</p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Edit the server URL below and retry.
        </p>
      </div>

      {/* Editable server URL — does NOT affect socket connection */}
      <div className="w-full flex flex-col gap-1.5">
        <label className="text-[10px] text-zinc-600 uppercase tracking-widest text-left px-1">
          Server URL
        </label>

        <div
          className={`flex items-center gap-2 w-full bg-zinc-900 border rounded-lg px-3 h-9 transition-all duration-200 ${
            focused
              ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
              : isDirty
                ? "border-yellow-500/40"
                : "border-zinc-700 hover:border-zinc-600"
          }`}
        >
          <Server
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              focused ? "text-blue-400" : "text-zinc-600"
            }`}
          />
          <input
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleRetry()}
            placeholder="http://localhost:3000"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent text-xs font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600"
          />
          {/* Reset to original URL */}
          {isDirty && (
            <button
              onClick={handleReset}
              title="Reset to original"
              className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick checklist — helps user self-diagnose */}
      <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 flex flex-col gap-1.5 text-left">
        {[
          {
            icon: <Zap className="w-3 h-3" />,
            text: "NestJS server is running",
          },
          {
            icon: <Layers className="w-3 h-3" />,
            text: "WsgateModule is imported",
          },
          {
            icon: <Server className="w-3 h-3" />,
            text: "Port & URL are correct",
          },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <span className="text-zinc-600 shrink-0">{icon}</span>
            <span className="text-[11px] text-zinc-500">{text}</span>
          </div>
        ))}
      </div>

      {/* Retry — turns blue when URL is edited */}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className={`w-full flex items-center justify-center gap-2 text-xs font-medium rounded-lg px-4 py-2.5 border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          isDirty
            ? "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/30"
            : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100"
        }`}
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`}
        />
        {retrying ? "Retrying..." : isDirty ? "Save & Retry" : "Retry"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────

/**
 * Namespace section header — prominently displays the namespace
 * with icon, display name, and total event count.
 *
 * @param ns           - The namespace string (e.g. `'/chat'`).
 * @param count        - Total events in this namespace.
 * @param color        - Color config from palette.
 * @param isExpanded   - Whether this namespace section is expanded.
 * @param onToggle     - Called to toggle expansion.
 */
function NamespaceSectionHeader({
  ns,
  count,
  color,
  isExpanded,
  onToggle,
}: {
  ns: string;
  count: number;
  color: (typeof NAMESPACE_PALETTE)[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const displayName = getNamespaceDisplayName(ns);

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2.5 mt-3 first:mt-2 mb-1 group transition-colors hover:bg-zinc-800/30"
    >
      {/* Namespace dot indicator */}
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />

      {/* Namespace name */}
      <span className="flex-1 text-left text-[11px] font-bold text-zinc-100 uppercase tracking-widest truncate">
        {displayName}
      </span>

      {/* Event count badge */}
      <Badge
        variant="outline"
        className="text-[9px] border-zinc-700 text-zinc-500 px-1.5 h-4 shrink-0"
      >
        {count}
      </Badge>

      {/* Expand / collapse chevron */}
      <ChevronRight
        className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 shrink-0 ${
          isExpanded ? "rotate-90" : ""
        }`}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────

/**
 * Collapsible section header for grouping events by gateway name.
 * Nested under a namespace section.
 *
 * @param name      - The gateway class name.
 * @param count     - Number of events in this group.
 * @param collapsed - Whether the section is collapsed.
 * @param onToggle  - Toggles collapsed state.
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
      className="w-full flex items-center gap-2 px-3 py-1.5 mt-2 ml-2 group"
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

// ─────────────────────────────────────────────────────

/**
 * Single event row inside a gateway group.
 *
 * @param event      - The WsEvent to render.
 * @param isSelected - Whether this event is currently selected.
 * @param onSelect   - Called when the row is clicked.
 */
function EventRow({
  event,
  isSelected,
  onSelect,
}: {
  event: WsEvent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const typeConf = TYPE_CONFIG[event.type];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-1 transition-all duration-150 mb-0.5 group border ${
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
 * - Editable URL in error state — does NOT touch socket connection
 *
 * Selected event is persisted via Zustand store.
 */
export default function Sidebar() {
  // ── Stores ────────────────────────────────────────────

  const {
    url,
    selectedEvent,
    selectedNamespace,
    setSelectedEvent,
    setSelectedNamespace,
    setAvailableNamespaces,
  } = useWsgateStore();
  const { status, disconnect } = useSocketStore();

  // ── Local state ───────────────────────────────────────

  const [events, setEvents] = useState<WsEvent[]>([]);
  const [title, setTitle] = useState("nestjs-wsgate");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeNamespace, setActiveNamespace] = useState<string | null>(null);

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

    fetch(`${target}/wsgate/events.json`)
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
  }, [url]);

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

      {/* ── Search input — only shown when events are loaded ── */}
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
        {loading && <ShimmerList />}

        {/* Error state — passes editUrl to fetchEvents, never to setUrl */}
        {!loading && error && (
          <ErrorState
            url={url}
            onRetry={(editedUrl) => fetchEvents(editedUrl)}
          />
        )}

        {/* Empty search result */}
        {!loading && !error && filtered.length === 0 && search && (
          <EmptySearch query={search} onClear={() => setSearch("")} />
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
                    <div className="border-l border-zinc-800/40 ml-5 pl-3">
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
          {/* Active namespace indicator */}
          {activeNamespace && (
            <>
              <div className="flex-1" />
              <button
                onClick={() => setActiveNamespace(null)}
                title="Clear namespace filter"
                className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors group"
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
