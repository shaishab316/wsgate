/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useWsgateStore } from "@/store/wsgate.store";
import type { WsEvent, WsEventsResponse } from "@/types/ws-event";

// ── Badge config ──────────────────────────────────────

/**
 * Visual configuration for each event type badge.
 * Maps `emit` and `subscribe` to their respective Tailwind classNames.
 */
const TYPE_CONFIG: Record<"emit" | "subscribe", string> = {
  emit: "border-blue-500 text-blue-400",
  subscribe: "border-green-500 text-green-400",
};

// ── Component ─────────────────────────────────────────

/**
 * Left sidebar panel for the nestjs-wsgate UI.
 *
 * Fetches discovered `@WsDoc()` events from the events JSON endpoint.
 * The endpoint URL is derived from the store's `url` field:
 * `{url}/wsgate/events.json`
 *
 * Selected event is read and written via Zustand store,
 * persisted to localStorage automatically.
 *
 * Each event displays:
 * - The Socket.IO event name
 * - A `type` badge (`emit` or `subscribe`)
 * - A short description
 */
export default function Sidebar() {
  // ── Store ─────────────────────────────────────────────

  const { url, selectedEvent, setSelectedEvent } = useWsgateStore();

  // ── Local state ───────────────────────────────────────

  const [events, setEvents] = useState<WsEvent[]>([]);
  const [title, setTitle] = useState("nestjs-wsgate");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch events ──────────────────────────────────────

  /**
   * Fetches event metadata from `{url}/wsgate/events.json` on mount.
   * Re-fetches whenever the store URL changes.
   */
  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    fetch(`${url}/wsgate/events.json`)
      .then((res) => res.json() as Promise<WsEventsResponse>)
      .then((data) => {
        setEvents(data.events);
        setTitle(data.title);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load events");
        setLoading(false);
      });
  }, [url]);

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header — displays the API title from events.json */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Socket.IO Explorer</p>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Loading state */}
        {loading && (
          <p className="text-xs text-zinc-600 text-center mt-4">
            Loading events...
          </p>
        )}

        {/* Error state */}
        {error && (
          <p className="text-xs text-red-400 text-center mt-4">{error}</p>
        )}

        {/* Event items */}
        {!loading &&
          !error &&
          events.map((event) => (
            <button
              key={`${event.gatewayName}:${event.event}:${event.type}`}
              onClick={() => setSelectedEvent(event)}
              className={`w-full text-left px-4 py-2.5 flex flex-col gap-1 hover:bg-zinc-800 transition-colors border-l-2 ${
                selectedEvent?.event === event.event &&
                selectedEvent?.type === event.type
                  ? "bg-zinc-800 border-blue-500"
                  : "border-transparent"
              }`}
            >
              {/* Event name + type badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono text-zinc-100 truncate">
                  {event.event}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${TYPE_CONFIG[event.type]}`}
                >
                  {event.type}
                </Badge>
              </div>

              {/* Short description */}
              <span className="text-xs text-zinc-500 truncate">
                {event.description}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
