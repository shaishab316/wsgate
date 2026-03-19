import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import EventPanel from "./components/EventPanel";
import EventLog from "./components/EventLog";
import { useSocket } from "./hooks/useSocket";
import type { WsEvent } from "./types/ws-event";
import type { LogEntry } from "./types/log";

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState<WsEvent | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

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

  const { status, connect, disconnect, emit } = useSocket({
    onEvent: (event, data) => addLog("in", event, data),
  });

  const connected = status === "connected";

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Navbar status={status} onConnect={connect} onDisconnect={disconnect} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-zinc-800">
          <Sidebar onSelect={setSelectedEvent} selected={selectedEvent} />
        </aside>

        <main className="flex-1 border-r border-zinc-800 overflow-y-auto">
          <EventPanel
            event={selectedEvent}
            onLog={(event, data) => addLog("out", event, data)}
            emit={emit}
            connected={connected}
          />
        </main>

        <aside className="w-80">
          <EventLog logs={logs} onClear={() => setLogs([])} />
        </aside>
      </div>
    </div>
  );
}
