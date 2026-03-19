import { useSocket } from "./hooks/useSocket";
import { useWsgateStore } from "./store/wsgate.store";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import EventPanel from "./components/EventPanel";
import EventLog from "./components/EventLog";

export default function App() {
  const { addLog } = useWsgateStore();

  const { status, connect, disconnect, emit } = useSocket({
    onEvent: (event, data) => addLog("in", event, data),
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Navbar status={status} onConnect={connect} onDisconnect={disconnect} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-zinc-800">
          <Sidebar />
        </aside>
        <main className="flex-1 border-r border-zinc-800 overflow-y-auto">
          <EventPanel connected={status === "connected"} emit={emit} />
        </main>
        <aside className="w-80">
          <EventLog />
        </aside>
      </div>
    </div>
  );
}
