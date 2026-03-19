import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WsEvent } from "@/types/ws-event";

interface Props {
  event: WsEvent | null;
  connected: boolean;
  emit: (event: string, payload: unknown) => void;
  onLog: (event: string, data: unknown) => void;
}

export default function EventPanel({ event, connected, emit, onLog }: Props) {
  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Auto generate payload from event schema
  useEffect(() => {
    if (!event) return;
    const generated = Object.fromEntries(
      Object.entries(event.payload).map(([key]) => [key, ""]),
    );
    setPayload(JSON.stringify(generated, null, 2));
    setError(null);
  }, [event]);

  function handleEmit() {
    if (!event) return;
    try {
      const parsed = JSON.parse(payload);
      setError(null);
      emit(event.event, parsed);
      onLog(event.event, parsed);
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
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Event header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold font-mono text-zinc-100">
            {event.event}
          </h2>
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-400 text-xs"
          >
            {event.gatewayName}
          </Badge>
          {event.auth === "bearer" && (
            <Badge
              variant="outline"
              className="border-yellow-500 text-yellow-400 text-xs"
            >
              bearer
            </Badge>
          )}
        </div>
        <p className="text-xs text-zinc-500">{event.description}</p>
      </div>

      {/* Payload schema */}
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Payload Schema
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(event.payload).map(([key, type]) => (
            <span
              key={key}
              className="text-xs font-mono bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400"
            >
              {key}: <span className="text-blue-400">{type}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Response event */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Response
        </span>
        <span className="text-xs font-mono text-green-400 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5">
          {event.response}
        </span>
      </div>

      {/* Payload editor */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Payload (JSON)
          </span>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
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
        />
      </div>

      {/* Emit button */}
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
