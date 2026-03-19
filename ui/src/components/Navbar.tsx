/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWsgateStore } from "@/store/wsgate.store";
import { useSocketStore } from "@/hooks/useSocket";
import { debounce } from "@/utils/debounce";
import type { SocketStatus } from "@/hooks/useSocket";

// ── Status config ─────────────────────────────────────

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

// ── Inline resize handle ───────────────────────────────

/**
 * Thin vertical drag handle for use inside the Navbar.
 * Kept subtle — just a 1px divider that glows blue on hover.
 */
function NavResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-2 h-9 flex items-center justify-center cursor-col-resize shrink-0">
      <div className="w-px h-5 bg-zinc-700 group-hover:bg-blue-500/60 group-active:bg-blue-500 transition-colors duration-150 rounded-full" />
    </PanelResizeHandle>
  );
}

// ── Component ─────────────────────────────────────────

export default function Navbar() {
  // ── Stores ──────────────────────────────────────────

  const { url, token, setUrl, setToken } = useWsgateStore();
  const { status, connect, disconnect } = useSocketStore();

  // ── Local state ─────────────────────────────────────

  const [urlInput, setUrlInput] = useState(url);

  // ── Debounced store update ───────────────────────────

  const debouncedSetUrl = useRef(
    debounce((value: string) => setUrl(value), 500),
  ).current;

  // ── Derived ─────────────────────────────────────────

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const config = STATUS_CONFIG[status];

  // ── Handlers ────────────────────────────────────────

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrlInput(e.target.value);
    debouncedSetUrl(e.target.value);
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex items-center gap-2 px-4 h-14 border-b border-zinc-800 bg-zinc-950 shrink-0">
      {/* Logo — fixed width, never resizes */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">W</span>
        </div>
        <span className="text-sm font-semibold text-zinc-100 mr-2">wsgate</span>
      </div>

      {/* Resizable URL + Token inputs */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="wsgate-navbar-inputs"
        className="flex-1"
        style={{ height: "36px", overflow: "hidden" }} // ← fix: lock to h-9 (36px)
      >
        {/* URL input */}
        <Panel defaultSize={65} minSize={35} maxSize={80}>
          <div className="flex items-center w-full h-9 bg-zinc-900 border border-zinc-700 rounded-md px-3 gap-2 focus-within:border-zinc-500 transition-colors">
            <span className="text-xs text-zinc-600 font-mono shrink-0">
              URL
            </span>
            <input
              value={urlInput}
              onChange={handleUrlChange}
              disabled={isConnected || isConnecting}
              placeholder="http://localhost:3000"
              className="flex-1 min-w-0 bg-transparent text-sm font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />
          </div>
        </Panel>

        <NavResizeHandle />

        {/* Token input */}
        <Panel defaultSize={35} minSize={20} maxSize={65}>
          <div className="flex items-center w-full h-9 bg-zinc-900 border border-zinc-700 rounded-md px-3 gap-2 focus-within:border-zinc-500 transition-colors">
            <span className="text-xs text-zinc-600 font-mono shrink-0">
              Token
            </span>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isConnected || isConnecting}
              placeholder="optional"
              type="password"
              className="flex-1 min-w-0 bg-transparent text-sm font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />
          </div>
        </Panel>
      </PanelGroup>

      {/* Connect / Disconnect button — fixed, never resizes */}
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

      {/* Status badge — fixed, never resizes */}
      <Badge
        variant="outline"
        className={`shrink-0 text-xs ${config.className}`}
      >
        {config.label}
      </Badge>
    </div>
  );
}
