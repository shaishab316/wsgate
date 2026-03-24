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
 * - Real-time connection status indicator with animated pulse
 * - Connect/Disconnect button with loading state
 * - Namespace selector with auto-disconnect on namespace change
 * - Theme toggle (dark/light mode) with system preference fallback
 * - Resizable input panels with localStorage persistence
 * - Token visibility toggle for security
 *
 * @accessibility
 * - All inputs have associated labels for screen readers
 * - Token visibility toggle has clear aria-label
 * - Status indicator announces connection state
 * - All buttons keyboard accessible (Tab, Enter, Space)
 * - Focus indicators visible on all interactive elements
 * - Theme toggle respects system preferences (prefers-color-scheme)
 * - Namespace selector provides keyboard navigation
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
 *
 * @remarks
 * - URL input debounces updates to prevent excessive re-renders (500ms)
 * - Token visibility is local state only (not persisted for security)
 * - Theme preference is stored in localStorage as 'wsgate-theme'
 * - Namespace changes auto-disconnect if currently connected
 * - Status dot pulses when connected, static when disconnected or error
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
    <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-950 to-blue-950/20 shrink-0 shadow-lg shadow-black/50">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 shrink-0 select-none grow">
        <img
          src={appIcon}
          alt="WS Gate Logo"
          className="size-9 invert dark:invert-0 drop-shadow-lg dark:drop-shadow-none"
        />
        <h1
          className="wsg-fadeUp wsg-shimmer text-[24px] font-bold font-mono tracking-tighter bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 dark:from-blue-400 dark:via-blue-500 dark:to-blue-400 bg-clip-text text-transparent"
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
            className={`flex items-center w-full h-9 bg-zinc-900 border rounded-lg px-3 gap-2.5 transition-all duration-200 ${
              urlFocused
                ? "border-blue-400/80 shadow-[0_0_0_4px_rgba(96,165,250,0.15)] bg-zinc-950"
                : isDisabled
                  ? "border-zinc-800 opacity-40"
                  : "border-zinc-700 hover:border-zinc-600 hover:shadow-[0_0_0_2px_rgba(120,113,233,0.1)]"
            }`}
          >
            <Server
              className={`w-4 h-4 shrink-0 transition-colors ${
                urlFocused ? "text-blue-400" : "text-zinc-500"
              }`}
            />
            <input
              value={urlInput}
              onChange={handleUrlChange}
              disabled={isDisabled}
              placeholder="http://localhost:3000"
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              className="flex-1 min-w-0 bg-transparent text-sm font-mono font-medium text-zinc-100 focus:outline-none placeholder:text-zinc-600 placeholder:font-normal disabled:cursor-not-allowed disabled:text-zinc-600"
            />
            {/* live dot when connected */}
            {isConnected && (
              <span className="shrink-0 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-pulse" />
              </span>
            )}
          </div>
        </Panel>

        <NavResizeHandle />

        {/* Token input */}
        <Panel defaultSize={35} minSize={20} maxSize={65}>
          <div
            className={`flex items-center w-full h-9 bg-zinc-900 border rounded-lg px-3 gap-2.5 transition-all duration-200 ${
              tokenFocused
                ? "border-blue-400/80 shadow-[0_0_0_4px_rgba(96,165,250,0.15)] bg-zinc-950"
                : isDisabled
                  ? "border-zinc-800 opacity-40"
                  : "border-zinc-700 hover:border-zinc-600 hover:shadow-[0_0_0_2px_rgba(236,72,153,0.1)]"
            }`}
          >
            <KeyRound
              className={`w-4 h-4 shrink-0 transition-colors ${
                tokenFocused ? "text-blue-400" : "text-zinc-500"
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
              className="flex-1 min-w-0 bg-transparent text-sm font-mono font-medium text-zinc-100 focus:outline-none placeholder:text-zinc-600 placeholder:font-normal disabled:cursor-not-allowed disabled:text-zinc-600"
            />
            {/* show / hide toggle */}
            {token && (
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                title={showToken ? "Hide token" : "Show token"}
                aria-label={showToken ? "Hide token" : "Show token"}
                className="shrink-0 text-zinc-600 hover:text-blue-400 transition-colors hover:scale-110 duration-200"
                tabIndex={-1}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
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
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-yellow-600/50 text-zinc-500 hover:text-yellow-400 transition-all duration-200 font-medium"
        title="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* ── Connect / Disconnect button ── */}
      {isConnected ? (
        <Button
          onClick={disconnect}
          size="sm"
          className="shrink-0 h-9 px-5 gap-2.5 bg-red-950/40 hover:bg-red-600/30 hover:border-red-500/60 text-red-300 hover:text-red-200 border border-red-800/60 hover:border-red-500/60 rounded-lg transition-all duration-200 font-semibold text-xs shadow-lg shadow-red-900/20 hover:shadow-red-900/30"
        >
          <Unplug className="w-4 h-4" />
          <span>Disconnect</span>
        </Button>
      ) : (
        <Button
          onClick={() => connect(url, token, selectedNamespace)}
          disabled={isConnecting || !url}
          size="sm"
          className="shrink-0 h-9 px-5 gap-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-lg shadow-blue-900/40 hover:shadow-blue-800/50 transition-all duration-200 font-semibold text-xs hover:scale-105 disabled:hover:scale-100"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plug className="w-4 h-4" />
          )}
          <span>{isConnecting ? "Connecting..." : "Connect"}</span>
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
        className={`shrink-0 h-8 px-3 gap-2 text-sm font-semibold rounded-lg transition-all duration-300 ${config.badgeClass} py-0`}
      >
        {/* animated dot */}
        <span className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
          {config.pulse && (
            <span
              className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${config.dotClass}`}
            />
          )}
          <span
            className={`relative w-2 h-2 rounded-full shadow-lg ${config.dotClass}`}
            style={{
              boxShadow: config.pulse
                ? `0 0 12px currentColor`
                : `0 0 6px currentColor`,
            }}
          />
        </span>
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    </div>
  );
}
