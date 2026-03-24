/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Moon,
  Plug,
  Server,
  Sun,
  Unplug,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import appIcon from "@/assets/icon.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSocketStore } from "@/hooks/useSocket";
import { useWsgateStore } from "@/store/wsgate.store";
import { debounce } from "@/utils/debounce";
import { STATUS_CONFIG } from "./sub-components/Config";
import { NamespacePicker } from "./sub-components/NamespacePicker";
import { NavResizeHandle } from "./sub-components/NavResizeHandle";

/**
 * Navbar component for WSGate application.
 *
 * Provides connection management UI with the following features:
 * - WebSocket URL and Bearer token input fields with debounced updates
 * - Real-time connection status indicator with animated dot
 * - Connect/Disconnect button with loading state
 * - Namespace selector with auto-disconnect on namespace change
 * - Theme toggle (dark/light mode)
 * - Resizable input panels with persist to localStorage
 * - Token visibility toggle
 *
 * @component
 * @returns {React.ReactElement} Navbar element with connection controls and status display
 *
 * @requires useWsgateStore - Provides URL, token, namespace state and setters
 * @requires useSocketStore - Provides socket connection status and control methods
 *
 * @example
 * ```tsx
 * <Navbar />
 * ```
 */
export default function Navbar() {
  // ── Stores ──────────────────────────────────────────

  const {
    url,
    token,
    setUrl,
    setToken,
    selectedEvent,
    selectedNamespace,
    setSelectedNamespace,
    availableNamespaces,
  } = useWsgateStore();
  const { status, connect, disconnect } = useSocketStore();

  // ── Local state ─────────────────────────────────────

  const [urlInput, setUrlInput] = useState(url);
  const [showToken, setShowToken] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);
  const [tokenFocused, setTokenFocused] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark((v) => !v);
    document.documentElement.classList.toggle("dark");
  };

  // ── Debounced store update ───────────────────────────

  const debouncedSetUrl = useRef(
    debounce((value: string) => setUrl(value), 500),
  ).current;

  // ── Derived ─────────────────────────────────────────

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isDisabled = isConnected || isConnecting;
  const config = STATUS_CONFIG[status];

  // ── Handle namespace change ─────────────────────────

  const handleNamespaceChange = (ns: string) => {
    setSelectedNamespace(ns);
    // Disconnect socket if connected when switching namespaces
    if (isConnected) {
      disconnect();
    }
  };

  // ── Sync selected namespace from event + auto-disconnect ──

  useEffect(() => {
    if (selectedEvent?.namespace) {
      const newNamespace = selectedEvent.namespace;
      // If namespace changed and socket is connected, disconnect old connection
      if (newNamespace !== selectedNamespace && isConnected) {
        disconnect();
      }
      setSelectedNamespace(newNamespace);
    }
  }, [
    selectedEvent,
    selectedNamespace,
    isConnected,
    setSelectedNamespace,
    disconnect,
  ]);

  // ── Handlers ────────────────────────────────────────

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrlInput(e.target.value);
    debouncedSetUrl(e.target.value);
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex items-center gap-2 px-4 h-14 border-b border-zinc-800 bg-zinc-950 shrink-0">
      {/* ── Logo ── */}
      <div className="flex items-center gap-2 shrink-0 select-none grow">
        <img
          src={appIcon}
          alt="WS Gate Logo"
          className="size-8 invert dark:invert-0"
        />
        <h1
          className="wsg-fadeUp wsg-shimmer text-[22px] font-semibold font-mono tracking-tight"
          style={{ animationDelay: "70ms" }}
        >
          wsgate
        </h1>
      </div>

      {/* ── Resizable URL + Token ── */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="wsgate-navbar-inputs"
        style={{ height: "36px", flex: 1, overflow: "hidden" }}
      >
        {/* URL input */}
        <Panel defaultSize={65} minSize={35} maxSize={80}>
          <div
            className={`flex items-center w-full h-9 bg-zinc-900 border rounded-lg px-3 gap-2 transition-all duration-200 ${
              urlFocused
                ? "border-blue-500/70 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                : isDisabled
                  ? "border-zinc-800 opacity-50"
                  : "border-zinc-700 hover:border-zinc-600"
            }`}
          >
            <Server
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                urlFocused ? "text-blue-400" : "text-zinc-600"
              }`}
            />
            <input
              value={urlInput}
              onChange={handleUrlChange}
              disabled={isDisabled}
              placeholder="http://localhost:3000"
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              className="flex-1 min-w-0 bg-transparent text-sm font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
            />
            {/* live dot when connected */}
            {isConnected && (
              <span className="shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            )}
          </div>
        </Panel>

        <NavResizeHandle />

        {/* Token input */}
        <Panel defaultSize={35} minSize={20} maxSize={65}>
          <div
            className={`flex items-center w-full h-9 bg-zinc-900 border rounded-lg px-3 gap-2 transition-all duration-200 ${
              tokenFocused
                ? "border-blue-500/70 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                : isDisabled
                  ? "border-zinc-800 opacity-50"
                  : "border-zinc-700 hover:border-zinc-600"
            }`}
          >
            <KeyRound
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                tokenFocused ? "text-blue-400" : "text-zinc-600"
              }`}
            />
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isDisabled}
              placeholder="Bearer token (optional)"
              type={showToken ? "text" : "password"}
              onFocus={() => setTokenFocused(true)}
              onBlur={() => setTokenFocused(false)}
              className="flex-1 min-w-0 bg-transparent text-sm font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
            />
            {/* show / hide toggle */}
            {token && (
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                title={showToken ? "Hide token" : "Show token"}
                aria-label={showToken ? "Hide token" : "Show token"}
                className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showToken ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* ── Theme Toggle ── */}
      <button
        type="button"
        onClick={toggleTheme}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all duration-200"
        title="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5" />
        ) : (
          <Moon className="w-3.5 h-3.5" />
        )}
      </button>

      {/* ── Connect / Disconnect button ── */}
      {isConnected ? (
        <Button
          onClick={disconnect}
          size="sm"
          className="shrink-0 h-9 px-4 gap-2 bg-zinc-800 hover:bg-red-600/20 hover:border-red-500/50 text-zinc-300 hover:text-red-400 border border-zinc-700 rounded-lg transition-all duration-200 invert dark:invert-0"
        >
          <Unplug className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Disconnect</span>
        </Button>
      ) : (
        <Button
          onClick={() => connect(url, token, selectedNamespace)}
          disabled={isConnecting || !url}
          size="sm"
          className="shrink-0 h-9 px-4 gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200 hover:shadow-blue-800/40 invert dark:invert-0"
        >
          {isConnecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plug className="w-3.5 h-3.5" />
          )}
          <span className="text-xs font-medium">
            {isConnecting ? "Connecting..." : "Connect"}
          </span>
        </Button>
      )}

      {/* ── Namespace Picker ── */}
      <NamespacePicker
        selectedNamespace={selectedNamespace}
        availableNamespaces={availableNamespaces}
        onSelect={handleNamespaceChange}
        disabled={isDisabled}
      />

      {/* ── Status badge ── */}
      <Badge
        variant="outline"
        className={`shrink-0 h-7 px-2.5 gap-1.5 text-xs font-medium rounded-lg transition-all duration-300 ${config.badgeClass} py-4`}
      >
        {/* animated dot */}
        <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
          {config.pulse && (
            <span
              className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${config.dotClass}`}
            />
          )}
          <span
            className={`relative w-1.5 h-1.5 rounded-full ${config.dotClass}`}
          />
        </span>
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    </div>
  );
}
