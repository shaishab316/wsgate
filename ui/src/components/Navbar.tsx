/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWsgateStore } from "@/store/wsgate.store";
import { useSocketStore } from "@/hooks/useSocket";
import { debounce } from "@/utils/debounce";
import type { SocketStatus } from "@/hooks/useSocket";

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
 * Reads URL and token from `useWsgateStore`.
 * Reads connection status and controls from `useSocketStore`.
 *
 * URL input uses a local `useState` for instant visual feedback,
 * while the Zustand store is updated via a debounced callback
 * (500ms after the user stops typing) to avoid excessive writes.
 *
 * Zero props — fully store-driven.
 */
export default function Navbar() {
  // ── Stores ────────────────────────────────────────────

  const { url, token, setUrl, setToken } = useWsgateStore();
  const { status, connect, disconnect } = useSocketStore();

  // ── Local state ───────────────────────────────────────

  /**
   * Local URL input state — updates instantly on every keystroke
   * for smooth controlled input behavior.
   */
  const [urlInput, setUrlInput] = useState(url);

  // ── Debounced store update ────────────────────────────

  /**
   * Debounced version of `setUrl` — only writes to the Zustand store
   * (and therefore localStorage) 500ms after the user stops typing.
   * Wrapped in `useRef` to prevent recreation on every render.
   */
  const debouncedSetUrl = useRef(
    debounce((value: string) => setUrl(value), 500),
  ).current;

  // ── Derived ───────────────────────────────────────────

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const config = STATUS_CONFIG[status];

  // ── Handlers ──────────────────────────────────────────

  /**
   * Handles URL input changes.
   * Updates local state instantly and debounces the store write.
   *
   * @param e - The input change event.
   */
  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrlInput(e.target.value);
    debouncedSetUrl(e.target.value);
  }

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

      {/* Server URL input — local state + debounced store update */}
      <div className="flex items-center flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 h-9 gap-2 focus-within:border-zinc-500 transition-colors">
        <span className="text-xs text-zinc-600 font-mono shrink-0">URL</span>
        <input
          value={urlInput}
          onChange={handleUrlChange}
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
          onClick={disconnect}
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
