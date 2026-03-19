/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket, type SocketStatus } from "@/hooks/useSocket";
import { useWsgateStore } from "@/store/wsgate.store";

// ── Status config ─────────────────────────────────────

/**
 * Visual configuration for each connection status.
 * Maps a `SocketStatus` to a Tailwind className and display label.
 */
const STATUS_CONFIG: Record<
  SocketStatus,
  { className: string; label: string }
> = {
  disconnected: {
    className: "border-zinc-600 text-zinc-500",
    label: "○ Disconnected",
  },
  connecting: {
    className: "border-yellow-500 text-yellow-400 animate-pulse",
    label: "◌ Connecting...",
  },
  connected: {
    className: "border-green-500 text-green-400",
    label: "● Connected",
  },
  error: {
    className: "border-red-500 text-red-400",
    label: "✕ Connection Error",
  },
};

// ── Component ─────────────────────────────────────────

/**
 * Top navigation bar for the nestjs-wsgate UI.
 *
 * Provides controls for:
 * - Entering the Socket.IO server URL
 * - Entering an optional Bearer token for authenticated connections
 * - Connecting and disconnecting from the server
 * - Displaying the real-time connection status
 *
 * The server URL is pre-populated from the `?url=` query parameter
 * injected by the NestJS server at render time.
 *
 * @example
 * // Served by NestJS with query params pre-filled:
 * // http://localhost:3000/wsgate?url=http://localhost:3000
 */
export default function Navbar() {
  // ── State ────────────────────────────────────────────

  /**
   * URL and token are read and written directly from the Zustand store.
   * No local state needed — persisted automatically to localStorage.
   */
  const { url, token, setUrl, setToken } = useWsgateStore();

  const { addLog } = useWsgateStore();

  const { status, connect, disconnect } = useSocket({
    onEvent: (event, data) => addLog("in", event, data),
  });

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const config = STATUS_CONFIG[status];

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex items-center gap-2 px-4 h-14 border-b border-zinc-800 bg-zinc-950 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-3 shrink-0">
        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">W</span>
        </div>
        <span className="text-sm font-semibold text-zinc-100">wsgate</span>
      </div>

      {/* Server URL input */}
      <div className="flex items-center flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 h-9 gap-2 focus-within:border-zinc-500 transition-colors">
        <span className="text-xs text-zinc-600 font-mono shrink-0">URL</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isConnected || isConnecting}
          placeholder="http://localhost:3000"
          className="flex-1 bg-transparent text-sm font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600 disabled:opacity-50"
        />
      </div>

      {/* Bearer token input */}
      <div className="flex items-center w-56 bg-zinc-900 border border-zinc-700 rounded-md px-3 h-9 gap-2 focus-within:border-zinc-500 transition-colors">
        <span className="text-xs text-zinc-600 font-mono shrink-0">Token</span>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isConnected || isConnecting}
          placeholder="optional"
          type="password"
          className="flex-1 bg-transparent text-sm font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600 disabled:opacity-50"
        />
      </div>

      {/* Connect / Disconnect button */}
      {isConnected ? (
        <Button
          onClick={() => disconnect()}
          size="sm"
          className="bg-red-600 hover:bg-red-500 text-white shrink-0"
        >
          Disconnect
        </Button>
      ) : (
        <Button
          onClick={() => connect(url, token)}
          disabled={isConnecting || !url}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 disabled:opacity-50"
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      )}

      {/* Real-time connection status badge */}
      <Badge
        variant="outline"
        className={`shrink-0 text-xs ${config.className}`}
      >
        {config.label}
      </Badge>
    </div>
  );
}
