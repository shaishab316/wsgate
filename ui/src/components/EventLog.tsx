import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  logs: string[];
}

export default function EventLog({ logs }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new log
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">Event Log</h2>
        <span className="text-xs text-zinc-500">{logs.length} events</span>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center mt-4">
            No events yet
          </p>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className="text-xs font-mono bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 whitespace-pre-wrap break-all"
            >
              {log}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Clear button */}
      {logs.length > 0 && (
        <div className="p-3 border-t border-zinc-800">
          <Button
            variant="outline"
            className="w-full text-xs text-zinc-400 border-zinc-700 hover:bg-zinc-800"
            onClick={() => window.location.reload()}
          >
            Clear Log
          </Button>
        </div>
      )}
    </div>
  );
}
