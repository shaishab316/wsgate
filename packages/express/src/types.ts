/**
 * @wsgate/express
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

// ── WebSocket Event Types ─────────────────────────────

/**
 * Describes a single WebSocket event for the wsgate UI.
 *
 * Mirrors the `WsEvent` interface from `@wsgate/ui` so the UI
 * renders express events identically to NestJS gateway events.
 */
export interface WsEventDoc {
  /** The Socket.IO event name (e.g. `sendMessage`). */
  event: string;

  /** A short human-readable description of what this event does. */
  description?: string;

  /**
   * The expected payload shape.
   * Keys are field names, values are their types (e.g. `{ roomId: 'string' }`).
   *
   * Supports:
   * - Primitives: `'string'`, `'number'`, `'boolean'`
   * - Enums: `'info | warn | error'` (pipe-separated)
   */
  payload?: Record<string, string>;

  /** The Socket.IO event name emitted back to the client. */
  response?: string;

  /**
   * Direction of the event.
   * - `emit`      — client sends this event to the server
   * - `subscribe` — server sends this event to the client
   * @default 'emit'
   */
  type?: "emit" | "subscribe";

  /**
   * The Socket.IO namespace this event belongs to (e.g. `'/chat'`).
   * Always starts with `'/'`. Defaults to `'/'` (root namespace).
   * @default '/'
   */
  namespace?: string;

  /**
   * The name of the handler function for this event (e.g. `handleMessage`).
   * Optional — for documentation purposes only.
   */
  handlerName?: string;

  /**
   * The name of the class or module this event belongs to (e.g. `ChatHandler`).
   * Optional — for documentation purposes only.
   */
  gatewayName?: string;
}

/**
 * Configuration options for the wsgate Express middleware.
 */
export interface WsgateOptions {
  /**
   * Title displayed in the wsgate UI header.
   * @default 'WsGate'
   */
  title?: string;

  /**
   * Disable the UI entirely.
   * Useful for production environments.
   *
   * @default false
   *
   * @example
   * ```ts
   * app.use('/wsgate', wsgate({
   *   disabled: process.env.NODE_ENV === 'production',
   *   events: [],
   * }));
   * ```
   */
  disabled?: boolean;

  /** Array of documented WebSocket events. */
  events: WsEventDoc[];
}
