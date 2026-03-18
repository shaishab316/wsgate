import { SetMetadata } from "@nestjs/common";

//? A unique key for storing WebSocket event documentation metadata on handler methods.
//! Don't change this!
export const WSGATE_EVENT_METADATA = "wsgate:event_doc";

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
   */
  payload?: Record<string, string>;

  /** The Socket.IO event name emitted back to the client (server → client). */
  response?: string;

  /**
   * The authentication strategy required for this event.
   * - `bearer` — requires a JWT Bearer token
   * - `basic`  — requires Basic auth credentials
   * - `none`   — no authentication required (default)
   */
  auth?: "bearer" | "basic" | "none";
}

/**
 * Decorator that marks a WebSocket gateway method as a documented event.
 * Metadata is collected at bootstrap and served via the nestjs-wsgate UI.
 *
 * @example
 * @WsDoc({
 *   event: 'sendMessage',
 *   description: 'Send a message to a room',
 *   payload: { roomId: 'string', message: 'string', sender: 'string' },
 *   response: 'receiveMessage',
 *   auth: 'bearer',
 * })
 * @SubscribeMessage('sendMessage')
 * handleMessage(@MessageBody() dto: SendMessageDto) {}
 */
export const WsDoc = (options: WsDocOptions): MethodDecorator => {
  options.auth ??= "none";

  return SetMetadata(WSGATE_EVENT_METADATA, options);
};
