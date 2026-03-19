import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  event: string | null;
  emit: (event: string, payload: unknown) => void;
  onLog: (msg: string) => void;
  connected: boolean;
}

export default function EventPanel({ event, emit, onLog, connected }: Props) {
  const [payload, setPayload] = useState("{\n  \n}");
  const [error, setError] = useState<string | null>(null);

  function handleEmit() {
    if (!event) return;

    try {
      const parsed = JSON.parse(payload);
      setError(null);
      emit(event, parsed);
      const timestamp = new Date().toLocaleTimeString();
      onLog(`[${timestamp}] → ${event}\n${JSON.stringify(parsed, null, 2)}`);
    } catch {
      setError("Invalid JSON payload");
    }
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
          <span className="text-zinc-600 text-lg">↑</span>
        </div>
        <p className="text-sm text-zinc-600">Select an event to emit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 gap-5">
      {/* Event header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold font-mono text-zinc-100">
          {event}
        </h2>
        <Badge
          variant="outline"
          className="border-blue-500 text-blue-400 text-xs"
        >
          emit
        </Badge>
      </div>

      {/* Payload label */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Payload (JSON)
        </span>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {/* Payload textarea */}
      <textarea
        value={payload}
        onChange={(e) => {
          setPayload(e.target.value);
          setError(null);
        }}
        className={`flex-1 bg-zinc-900 border rounded-md p-3 text-sm font-mono text-zinc-100 resize-none focus:outline-none transition-colors ${
          error
            ? "border-red-500 focus:border-red-400"
            : "border-zinc-700 focus:border-zinc-500"
        }`}
        spellCheck={false}
        placeholder="{}"
      />

      {/* Emit button — only this is disabled when not connected */}
      <Button
        onClick={handleEmit}
        disabled={!connected}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connected ? "Emit Event" : "Connect to emit"}
      </Button>
    </div>
  );
}
