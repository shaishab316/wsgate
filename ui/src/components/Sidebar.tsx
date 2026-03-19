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
 */
const TYPE_CONFIG: Record<"emit" | "subscribe", string> = {
  emit: "border-blue-500 text-blue-400",
  subscribe: "border-green-500 text-green-400",
};

// ── Shimmer skeleton ──────────────────────────────────

/**
 * Renders a list of shimmer placeholder items
 * while the events are being fetched.
 */
function ShimmerList() {
  return (
    <div className="flex flex-col py-2 px-3 gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-md">
          {/* Event name + badge row */}
          <div className="flex items-center justify-between gap-2">
            <div
              className="h-3 rounded bg-zinc-800 animate-pulse"
              style={{ width: `${45 + (i % 3) * 15}%` }}
            />
            <div className="h-4 w-14 rounded-full bg-zinc-800 animate-pulse" />
          </div>

          {/* Description row */}
          <div
            className="h-2.5 rounded bg-zinc-800/70 animate-pulse"
            style={{ width: `${60 + (i % 2) * 20}%` }}
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
    <div className="flex flex-col items-center justify-center px-5 py-10 gap-4 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping" />
      </div>

      {/* Title + description */}
      <div className="flex flex-col gap-1">
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
      <div className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2">
        <p className="text-xs font-mono text-red-400 truncate">
          {url}/wsgate/events.json
        </p>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 transition-colors"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Retry
      </button>
    </div>
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

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Socket.IO Explorer</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Loading — shimmer skeleton */}
        {loading && <ShimmerList />}

        {/* Error state */}
        {!loading && error && <ErrorState url={url} onRetry={fetchEvents} />}

        {/* Event list */}
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

              {/* Description */}
              <span className="text-xs text-zinc-500 truncate">
                {event.description}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
