/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

// ── Event Log Types ───────────────────────────────────

/**
 * Represents a single entry in the WebSocket event log.
 * Each entry corresponds to either an emitted or received socket event.
 */
export interface LogEntry {
  /** Unique auto-incrementing identifier for this log entry. */
  id: number;

  /** Human-readable time the event was logged (e.g. `12:34:56 PM`). */
  timestamp: string;

  /**
   * The direction of the event.
   * - `out` — emitted by the client (↑)
   * - `in`  — received from the server (↓)
   */
  direction: "in" | "out";

  /** The Socket.IO event name (e.g. `sendMessage`, `room:joined`). */
  event: string;

  /** The payload data associated with this event. */
  data: unknown;
}
