/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

// ── Types ─────────────────────────────────────────────

/**
 * Represents the current state of the Socket.IO connection.
 * - `disconnected` — no active connection
 * - `connecting`   — connection attempt in progress
 * - `connected`    — successfully connected to the server
 * - `error`        — connection attempt failed
 */
export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * Options for the `useSocket` hook.
 */
interface UseSocketOptions {
  /**
   * Callback invoked whenever the server emits any event.
   *
   * @param event - The Socket.IO event name.
   * @param data  - The payload received from the server.
   */
  onEvent: (event: string, data: unknown) => void;
}

/**
 * A React hook that manages a Socket.IO connection lifecycle.
 *
 * Handles connecting, disconnecting, emitting events, and
 * listening to all incoming server events via `socket.onAny()`.
 *
 * @param options - Hook configuration. See {@link UseSocketOptions}.
 * @returns       Connection status and socket control functions.
 *
 * @example
 * const { status, connect, disconnect, emit } = useSocket({
 *   onEvent: (event, data) => console.log(event, data),
 * })
 */
export function useSocket({ onEvent }: UseSocketOptions) {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const socketRef = useRef<Socket | null>(null);

  // ── Connect ───────────────────────────────────────────

  /**
   * Establishes a Socket.IO connection to the given URL.
   * Optionally passes an auth token via the `auth` handshake.
   *
   * @param url   - The server URL to connect to (e.g. `http://localhost:3000`).
   * @param token - Optional Bearer token for authenticated connections.
   */
  function connect(url: string, token: string) {
    setStatus("connecting");

    const socket = io(url, {
      auth: token ? { token } : {},
      transports: ["websocket"],
    });

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    // Listen to ALL incoming server events and forward to callback
    socket.onAny((event: string, data: unknown) => {
      onEvent(event, data);
    });

    socketRef.current = socket;
  }

  // ── Disconnect ────────────────────────────────────────

  /**
   * Disconnects the active Socket.IO connection and resets state.
   */
  function disconnect() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus("disconnected");
  }

  // ── Emit ──────────────────────────────────────────────

  /**
   * Emits a Socket.IO event to the server with the given payload.
   *
   * @param event   - The event name to emit.
   * @param payload - The data to send with the event.
   */
  function emit(event: string, payload: unknown) {
    socketRef.current?.emit(event, payload);
  }

  return { status, connect, disconnect, emit };
}
