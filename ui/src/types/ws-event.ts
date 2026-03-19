/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

// ── WebSocket Event Types ─────────────────────────────

/**
 * Represents a single WebSocket gateway event discovered
 * from a method decorated with `@WsDoc()`.
 */
export interface WsEvent {
  /** The Socket.IO event name (e.g. `sendMessage`). */
  event: string;

  /** A short human-readable description of what this event does. */
  description: string;

  /**
   * The expected payload shape.
   * Keys are field names, values are their types (e.g. `{ roomId: 'string' }`).
   */
  payload: Record<string, string>;

  /** The Socket.IO event name emitted back from the server. */
  response: string;

  /**
   * Whether this event is emitted by the client or received from the server.
   * - `emit`      — client sends this event to the server
   * - `subscribe` — server sends this event to the client
   */
  type: "emit" | "subscribe";

  /** The name of the method that handles this event (e.g. `handleMessage`). */
  handlerName: string;

  /** The name of the gateway class this event belongs to (e.g. `ChatGateway`). */
  gatewayName: string;

  /**
   * The resolved Socket.IO namespace this event belongs to (e.g. `'/chat'`).
   *
   * Always starts with `'/'`. Defaults to `'/'` (the root Socket.IO namespace)
   * when neither `@WsDoc()` nor `@WebSocketGateway()` specifies one.
   */
  namespace: string;
}

/**
 * The shape of the JSON response from `/wsgate/events.json`.
 *
 * @example
 * {
 *   title: 'Simple Chat',
 *   events: [{ event: 'sendMessage', ... }]
 * }
 */
export interface WsEventsResponse {
  /** The title displayed in the wsgate UI header. */
  title: string;

  /** All discovered WebSocket events. */
  events: WsEvent[];
}
