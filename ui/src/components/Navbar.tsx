/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useRef, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Plug,
  Unplug,
  Loader2,
  Server,
  KeyRound,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  AlertTriangle,
  GitBranch,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWsgateStore } from "@/store/wsgate.store";
import { useSocketStore } from "@/hooks/useSocket";
import { debounce } from "@/utils/debounce";
import type { SocketStatus } from "@/hooks/useSocket";
import appIcon from "@/assets/icon.png";

// ── Status config ─────────────────────────────────────

const STATUS_CONFIG: Record<
  SocketStatus,
  {
    badgeClass: string;
    dotClass: string;
    label: string;
    icon: React.ReactNode;
    pulse: boolean;
  }
> = {
  disconnected: {
    badgeClass: "border-zinc-700 text-zinc-500 bg-zinc-900/60",
    dotClass: "bg-zinc-600",
    label: "Disconnected",
    icon: <WifiOff className="w-3 h-3" />,
    pulse: false,
  },
  connecting: {
    badgeClass: "border-yellow-500/50 text-yellow-400 bg-yellow-500/5",
    dotClass: "bg-yellow-400",
    label: "Connecting",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    pulse: true,
  },
  connected: {
    badgeClass: "border-emerald-500/50 text-emerald-400 bg-emerald-500/5",
    dotClass: "bg-emerald-400",
    label: "Connected",
    icon: <Wifi className="w-3 h-3" />,
    pulse: true,
  },
  error: {
    badgeClass: "border-red-500/50 text-red-400 bg-red-500/5",
    dotClass: "bg-red-400",
    label: "Error",
    icon: <AlertTriangle className="w-3 h-3" />,
    pulse: false,
  },
};

// ── Namespace picker ──────────────────────────────────

function NamespacePicker({
  selectedNamespace,
  availableNamespaces,
  onSelect,
  disabled,
}: {
  selectedNamespace: string | null;
  availableNamespaces: string[];
  onSelect: (ns: string) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayName = (ns: string) => {
    if (ns === "/") return "Global";
    return ns.slice(1).charAt(0).toUpperCase() + ns.slice(2);
  };

  const getColorClass = (ns: string, isActive: boolean) => {
    const colors: Record<string, { idle: string; active: string }> = {
      "/": {
        idle: "border-zinc-700 text-zinc-400 hover:text-zinc-300",
        active: "border-zinc-500 text-zinc-100 bg-zinc-800",
      },
      "/chat": {
        idle: "border-emerald-500/25 text-emerald-500/80 hover:text-emerald-400",
        active: "border-emerald-400 text-emerald-300 bg-emerald-500/15",
      },
      "/admin": {
        idle: "border-purple-500/25 text-purple-500/80 hover:text-purple-400",
        active: "border-purple-400 text-purple-300 bg-purple-500/15",
      },
    };

    const colorSet = colors[ns] || {
      idle: "border-amber-500/25 text-amber-500/80 hover:text-amber-400",
      active: "border-amber-400 text-amber-300 bg-amber-500/15",
    };

    return isActive ? colorSet.active : colorSet.idle;
  };

  if (availableNamespaces.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 h-9 px-3 rounded-lg border transition-all duration-200 ${
          disabled
            ? "border-zinc-800 opacity-50 cursor-not-allowed"
            : "border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100"
        }`}
      >
        <GitBranch className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-medium">
          {selectedNamespace
            ? getDisplayName(selectedNamespace)
            : "Select Namespace"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 z-50 overflow-hidden">
          {availableNamespaces.map((ns) => {
            const isActive = selectedNamespace === ns;
            return (
              <button
                key={ns}
                onClick={() => {
                  onSelect(ns);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium border-l-2 transition-all duration-150 ${getColorClass(
                  ns,
                  isActive,
                )} hover:bg-zinc-800/50`}
              >
                <span>{getDisplayName(ns)}</span>
                {isActive && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Resize handle ─────────────────────────────────────

function NavResizeHandle() {
  return (
    <PanelResizeHandle
      style={{ height: "36px" }}
      className="group relative w-3 flex items-center justify-center cursor-col-resize shrink-0"
    >
      <div className="flex flex-col gap-[3px] opacity-30 group-hover:opacity-100 transition-opacity duration-150">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-[3px] h-[3px] rounded-full bg-zinc-400 group-hover:bg-blue-400 group-active:bg-blue-300 transition-colors duration-150"
          />
        ))}
      </div>
    </PanelResizeHandle>
  );
}

// ── Component ─────────────────────────────────────────

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
    if (selectedEvent && selectedEvent.namespace) {
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
        <img src={appIcon} alt="WS Gate Logo" className="size-8" />
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
                onClick={() => setShowToken((v) => !v)}
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

      {/* ── Connect / Disconnect button ── */}
      {isConnected ? (
        <Button
          onClick={disconnect}
          size="sm"
          className="shrink-0 h-9 px-4 gap-2 bg-zinc-800 hover:bg-red-600/20 hover:border-red-500/50 text-zinc-300 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 rounded-lg transition-all duration-200"
        >
          <Unplug className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Disconnect</span>
        </Button>
      ) : (
        <Button
          onClick={() => connect(url, token, selectedNamespace)}
          disabled={isConnecting || !url}
          size="sm"
          className="shrink-0 h-9 px-4 gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200 hover:shadow-blue-800/40"
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
        className={`shrink-0 h-7 px-2.5 gap-1.5 text-xs font-medium rounded-lg transition-all duration-300 ${config.badgeClass}`}
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
