import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import EventPanel from "./components/EventPanel";
import EventLog from "./components/EventLog";

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-zinc-800">
          <Sidebar />
        </aside>
        <main className="flex-1 border-r border-zinc-800 overflow-y-auto">
          <EventPanel />
        </main>
        <aside className="w-80">
          <EventLog />
        </aside>
      </div>
    </div>
  );
}
