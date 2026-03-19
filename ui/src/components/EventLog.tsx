// src/components/EventLog.tsx
import { useRef, useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import Editor from "@monaco-editor/react";
import type { LogEntry } from "@/types/log";

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export default function EventLog({ logs, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [filterInput, setFilterInput] = useState("");
  const [filter, setFilter] = useState("");
  const [direction, setDirection] = useState<"all" | "in" | "out">("all");

  const { filteredLogs, regexError } = useMemo(() => {
    let result = logs;

    if (direction !== "all") {
      result = result.filter((log) => log.direction === direction);
    }

    if (!filter) return { filteredLogs: result, regexError: false };

    try {
      const regex = new RegExp(filter, "i");
      return {
        filteredLogs: result.filter((log) => regex.test(log.event)),
        regexError: false,
      };
    } catch {
      return { filteredLogs: result, regexError: true };
    }
  }, [filter, logs, direction]);

  useEffect(() => {
    if (!filter && direction === "all") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, filter, direction]);

  function applyFilter() {
    setFilter(filterInput);
  }

  function clearFilter() {
    setFilterInput("");
    setFilter("");
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function copyPayload(id: number, data: unknown) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  function getEditorHeight(data: unknown): string {
    try {
      const lines = JSON.stringify(data, null, 2).split("\n").length;
      return `${Math.min(lines * 18 + 24, 200)}px`;
    } catch {
      return "80px";
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-100">Event Log</h2>
          {logs.length > 0 && (
            <Badge
              variant="outline"
              className="text-xs border-zinc-600 text-zinc-500"
            >
              {filteredLogs.length}/{logs.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Direction toggle */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-md p-0.5">
            {(["all", "out", "in"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  direction === d
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {d === "all" ? "All" : d === "out" ? "↑ Out" : "↓ In"}
              </button>
            ))}
          </div>

          {/* Clear */}
          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter input */}
      <div className="px-3 py-2 border-b border-zinc-800 shrink-0">
        <div className="flex gap-2">
          <div
            className={`flex items-center gap-2 bg-zinc-900 border rounded-md px-3 h-8 flex-1 transition-colors ${
              regexError
                ? "border-red-500"
                : filter
                  ? "border-zinc-500"
                  : "border-zinc-700"
            }`}
          >
            <span className="text-zinc-600 text-xs font-mono shrink-0">.*</span>
            <input
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              placeholder="filter by event name"
              className="flex-1 bg-transparent text-xs font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600"
            />
            {filterInput && (
              <button
                onClick={clearFilter}
                className="text-zinc-600 hover:text-zinc-400 text-xs shrink-0"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={applyFilter}
            className="shrink-0 h-8 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors border border-zinc-700"
          >
            Apply
          </button>
        </div>
        {regexError && (
          <p className="text-xs text-red-400 mt-1 px-1">Invalid regex</p>
        )}
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <span className="text-zinc-700 text-xs">○</span>
            </div>
            <p className="text-xs text-zinc-600">
              {filter || direction !== "all"
                ? "No matching events"
                : "No events yet"}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isOut = log.direction === "out";
            const isExpanded = expanded.has(log.id);
            const hasData = log.data !== undefined && log.data !== null;

            return (
              <div
                key={log.id}
                className={`rounded-md border text-xs font-mono overflow-hidden transition-all ${
                  isOut
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-green-500/30 bg-green-500/5"
                }`}
              >
                {/* Log header row */}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(log.id)}
                >
                  <span
                    className={`shrink-0 font-bold ${isOut ? "text-blue-400" : "text-green-400"}`}
                  >
                    {isOut ? "↑" : "↓"}
                  </span>
                  <span
                    className={`flex-1 truncate ${isOut ? "text-blue-300" : "text-green-300"}`}
                  >
                    {log.event}
                  </span>
                  <span className="text-zinc-600 shrink-0">
                    {log.timestamp}
                  </span>
                  {hasData && (
                    <span className="text-zinc-600 shrink-0">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  )}
                </div>

                {/* Expanded payload */}
                {isExpanded && hasData && (
                  <div className="border-t border-white/5">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-black/20">
                      <span className="text-zinc-600 text-xs">payload</span>
                      <button
                        onClick={() => copyPayload(log.id, log.data)}
                        className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        {copied === log.id ? "✓ copied" : "copy"}
                      </button>
                    </div>
                    <Editor
                      height={getEditorHeight(log.data)}
                      defaultLanguage="json"
                      value={JSON.stringify(log.data, null, 2)}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 12,
                        fontFamily: "JetBrains Mono, Fira Code, monospace",
                        lineNumbers: "off",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        folding: false,
                        renderLineHighlight: "none",
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                        scrollbar: { vertical: "hidden", horizontal: "hidden" },
                        padding: { top: 8, bottom: 8 },
                        contextmenu: false,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
