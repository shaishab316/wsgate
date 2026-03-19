/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useWsgateStore } from "@/store/wsgate.store";

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
 * The shape of the socket Zustand store.
 */
interface SocketState {
  /** Current connection status. */
  status: SocketStatus;

  /** Internal Socket.IO instance — not exposed to consumers. */
  _socket: Socket | null;

  /**
   * Establishes a Socket.IO connection.
   * Incoming events are automatically logged to the wsgate store.
   *
   * @param url   - The server URL to connect to.
   * @param token - Optional Bearer token for authenticated connections.
   */
  connect: (url: string, token: string) => void;

  /**
   * Disconnects the active Socket.IO connection and resets state.
   */
  disconnect: () => void;

  /**
   * Emits a Socket.IO event to the server with the given payload.
   *
   * @param event   - The event name to emit.
   * @param payload - The data to send with the event.
   */
  emit: (event: string, payload: unknown) => void;
}

// ── Store ─────────────────────────────────────────────

/**
 * Zustand store managing the Socket.IO connection lifecycle.
 *
 * Single instance shared across the entire app —
 * no prop drilling, no duplicate connections.
 *
 * Incoming server events are automatically forwarded to
 * `useWsgateStore().addLog()` so the Event Log updates in real time.
 *
 * @example
 * const { status, connect, disconnect, emit } = useSocketStore()
 */
export const useSocketStore = create<SocketState>((set, get) => ({
  // ── Initial state ──────────────────────────────────

  status: "disconnected",
  _socket: null,

  // ── Connect ───────────────────────────────────────────

  connect: (url, token) => {
    // Disconnect any existing connection first
    get()._socket?.disconnect();

    set({ status: "connecting" });

    const socket = io(url, {
      auth: token ? { token } : {},
      transports: ["websocket"],
    });

    socket.on("connect", () => set({ status: "connected" }));
    socket.on("disconnect", () => set({ status: "disconnected" }));
    socket.on("connect_error", () => set({ status: "error" }));

    // ── Forward ALL incoming server events to the event log ──
    socket.onAny((event: string, data: unknown) => {
      useWsgateStore.getState().addLog("in", event, data);
    });

    set({ _socket: socket });
  },

  // ── Disconnect ────────────────────────────────────────

  disconnect: () => {
    get()._socket?.disconnect();
    set({ _socket: null, status: "disconnected" });
  },

  // ── Emit ──────────────────────────────────────────────

  emit: (event, payload) => {
    get()._socket?.emit(event, payload);
  },
}));
