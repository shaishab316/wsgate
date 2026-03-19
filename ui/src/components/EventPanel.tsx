import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  event: string | null;
  onLog: (msg: string) => void;
}

export default function EventPanel({ event, onLog }: Props) {
  const [payload, setPayload] = useState("{\n  \n}");

  function handleEmit() {
    if (!event) return;
    const timestamp = new Date().toLocaleTimeString();
    onLog(`[${timestamp}] → ${event} ${payload}`);
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Select an event from the sidebar
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Event name */}
      <div>
        <h2 className="text-lg font-semibold font-mono text-zinc-100">
          {event}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Socket.IO Event</p>
      </div>

      {/* Payload editor */}
      <div className="flex flex-col gap-2 flex-1">
        <label className="text-xs text-zinc-400 uppercase tracking-wider">
          Payload
        </label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm font-mono text-zinc-100 resize-none focus:outline-none focus:border-zinc-500"
          spellCheck={false}
        />
      </div>

      {/* Emit button */}
      <Button
        onClick={handleEmit}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white"
      >
        Emit Event
      </Button>
    </div>
  );
}
