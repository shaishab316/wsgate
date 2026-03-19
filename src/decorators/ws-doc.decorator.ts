/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { SetMetadata } from "@nestjs/common";

// ── Metadata Key ──────────────────────────────────────

/**
 * A unique metadata key for storing WebSocket event documentation
 * on handler methods via `@WsDoc()`.
 *
 * @internal Do not change — this key is used internally by `WsgateExplorer`.
 */
export const WSGATE_EVENT_METADATA = "wsgate:event_doc";

// ── Types ─────────────────────────────────────────────

/**
 * Options for the `@WsDoc()` decorator.
 * Describes a WebSocket gateway event for the nestjs-wsgate UI.
 */
export interface WsDocOptions {
  /** The name of the Socket.IO event this handler listens to (client → server). */
  event: string;

  /** A short human-readable description of what this event does. */
  description?: string;

  /**
   * The expected payload shape for this event.
   * Keys are field names, values are their types (e.g. `{ roomId: 'string' }`).
   *
   * Supports:
   * - Primitives: `'string'`, `'number'`, `'boolean'`
   * - Enums: `'info | warn | error'` (pipe-separated)
   */
  payload?: Record<string, string>;

  /** The Socket.IO event name emitted back to the client (server → client). */
  response?: string;

  /**
   * Whether this event is emitted by the client or received from the server.
   * - `emit`      — client sends this event to the server (default)
   * - `subscribe` — server sends this event to the client
   *
   * @default 'emit'
   */
  type?: "emit" | "subscribe";
}

// ── Decorator ─────────────────────────────────────────

/**
 * Marks a WebSocket gateway method as a documented event.
 * Metadata is collected at bootstrap by `WsgateExplorer` and
 * served via the nestjs-wsgate interactive UI.
 *
 * @param options - Event documentation options. See {@link WsDocOptions}.
 *
 * @example
 * ```ts
 * @WsDoc({
 *   event: 'sendMessage',
 *   description: 'Send a message to a room',
 *   payload: { roomId: 'string', message: 'string' },
 *   response: 'receiveMessage',
 *   type: 'emit',
 * })
 * @SubscribeMessage('sendMessage')
 * handleMessage(@MessageBody() dto: SendMessageDto) {}
 * ```
 */
export const WsDoc = (options: WsDocOptions): MethodDecorator => {
  // Apply defaults
  options.type ??= "emit";

  return SetMetadata(WSGATE_EVENT_METADATA, options);
};
