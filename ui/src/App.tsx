import { useState } from "react";
import Sidebar from "./components/Sidebar";
import EventLog from "./components/EventLog";
import EventPanel from "./components/EventPanel";

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Left — event list */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col">
        <Sidebar onSelect={setSelectedEvent} selected={selectedEvent} />
      </aside>

      {/* Middle — event detail + emit */}
      <main className="flex-1 border-r border-zinc-800 overflow-y-auto">
        <EventPanel
          event={selectedEvent}
          onLog={(msg) => setLogs((p) => [...p, msg])}
        />
      </main>

      {/* Right — live log */}
      <aside className="w-80 flex flex-col">
        <EventLog logs={logs} />
      </aside>
    </div>
  );
}
