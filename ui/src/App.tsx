/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import EventPanel from "./components/EventPanel";
import EventLog from "./components/EventLog";

/**
 * Root application component for the nestjs-wsgate UI.
 *
 * Renders a three-panel layout:
 * - **Left**   — Sidebar listing all discovered `@WsDoc()` events
 * - **Center** — EventPanel for composing and emitting a selected event
 * - **Right**  — EventLog showing all emitted and received socket events
 *
 * All state is managed via Zustand stores:
 * - `useWsgateStore` — persisted UI state (url, token, selectedEvent, logs)
 * - `useSocketStore` — socket connection lifecycle
 *
 * Zero prop drilling.
 */
export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top navigation bar — connection controls and status */}
      <Navbar />

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — discovered event list */}
        <aside className="w-64 border-r border-zinc-800">
          <Sidebar />
        </aside>

        {/* Center — event composer and emitter */}
        <main className="flex-1 border-r border-zinc-800 overflow-y-auto">
          <EventPanel />
        </main>

        {/* Right — live event log */}
        <aside className="w-80">
          <EventLog />
        </aside>
      </div>
    </div>
  );
}
