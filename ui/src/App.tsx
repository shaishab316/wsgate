/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import EventPanel from "./components/EventPanel";
import EventLog from "./components/EventLog";

/**
 * Drag handle rendered between panels.
 *
 * - 4px wide hit area for easy grabbing
 * - Blue highlight on hover / active drag
 * - Three grip dots appear on hover for visual affordance
 */
function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-1 bg-zinc-800 hover:bg-blue-500/40 active:bg-blue-500 transition-colors duration-150 cursor-col-resize">
      {/* Grip dots */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
        ))}
      </div>
    </PanelResizeHandle>
  );
}

/**
 * Root application component for the nestjs-wsgate UI.
 *
 * Renders a three-panel resizable layout:
 * - **Left**   — Sidebar listing all discovered `@WsDoc()` events
 * - **Center** — EventPanel for composing and emitting a selected event
 * - **Right**  — EventLog showing all emitted and received socket events
 *
 * All state is managed via Zustand stores:
 * - `useWsgateStore` — persisted UI state (url, token, selectedEvent, logs)
 * - `useSocketStore` — socket connection lifecycle
 *
 * Zero prop drilling.
 * Panel sizes are persisted via `autoSaveId` across page refreshes.
 */
export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top navigation bar — connection controls and status */}
      <Navbar />

      {/* Three-panel resizable layout */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="wsgate-layout"
        className="flex-1 min-h-0" /* min-h-0 so PanelGroup itself can shrink */
      >
        {/* Left — discovered event list */}
        <Panel
          defaultSize={18}
          minSize={12}
          maxSize={30}
          className="flex flex-col overflow-hidden border-r border-zinc-800"
        >
          <Sidebar />
        </Panel>

        <ResizeHandle />

        {/* Center — event composer and emitter */}
        <Panel
          defaultSize={52}
          minSize={30}
          className="flex flex-col overflow-hidden border-r border-zinc-800"
        >
          <EventPanel />
        </Panel>

        <ResizeHandle />

        {/* Right — live event log */}
        <Panel
          defaultSize={30}
          minSize={18}
          maxSize={45}
          className="flex flex-col overflow-hidden"
        >
          <EventLog />
        </Panel>
      </PanelGroup>
    </div>
  );
}
