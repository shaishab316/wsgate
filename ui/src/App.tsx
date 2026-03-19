/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import EventPanel from "./components/EventPanel";
import EventLog from "./components/EventLog";
import { useSocket } from "./hooks/useSocket";
import type { WsEvent } from "./types/ws-event";
import type { LogEntry } from "./types/log";

// ── App ───────────────────────────────────────────────

/**
 * Root application component for the nestjs-wsgate UI.
 *
 * Renders a three-panel layout:
 * - **Left**   — Sidebar listing all discovered `@WsDoc()` events
 * - **Center** — EventPanel for composing and emitting a selected event
 * - **Right**  — EventLog showing all emitted and received socket events
 *
 * Connection state is managed via the `useSocket` hook and shared
 * across all panels through props.
 */
export default function App() {
  // ── State ──────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<WsEvent | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  /** Auto-incrementing ID for each log entry. */
  const logIdRef = useRef(0);

  // ── Logging ───────────────────────────────────────────

  /**
   * Appends a new entry to the event log.
   *
   * @param direction - `'in'` for server → client, `'out'` for client → server.
   * @param event     - The Socket.IO event name.
   * @param data      - The payload associated with the event.
   */
  function addLog(direction: "in" | "out", event: string, data: unknown) {
    setLogs((p) => [
      ...p,
      {
        id: logIdRef.current++,
        timestamp: new Date().toLocaleTimeString(),
        direction,
        event,
        data,
      },
    ]);
  }

  // ── Socket ────────────────────────────────────────────

  /**
   * Socket.IO connection hook.
   * All incoming server events are automatically logged as `'in'` entries.
   */
  const { status, connect, disconnect, emit } = useSocket({
    onEvent: (event, data) => addLog("in", event, data),
  });

  const connected = status === "connected";

  // ── Render ────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top navigation bar — connection controls and status */}
      <Navbar status={status} onConnect={connect} onDisconnect={disconnect} />

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — discovered event list */}
        <aside className="w-64 border-r border-zinc-800">
          <Sidebar selected={selectedEvent} onSelect={setSelectedEvent} />
        </aside>

        {/* Center — event composer and emitter */}
        <main className="flex-1 border-r border-zinc-800 overflow-y-auto">
          <EventPanel
            event={selectedEvent}
            connected={connected}
            emit={emit}
            onLog={(event, data) => addLog("out", event, data)}
          />
        </main>

        {/* Right — live event log */}
        <aside className="w-80">
          <EventLog logs={logs} onClear={() => setLogs([])} />
        </aside>
      </div>
    </div>
  );
}
