import { Clock, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { relativeTime } from "@/lib/utils";

export interface HistoryEntry {
  id: string;
  payload: string;
  sentAt: string;
  event: string;
}

/**
 * A dropdown component that displays the history of sent payloads.
 *
 * @component
 * @example
 * ```tsx
 * <HistoryDropdown
 *   history={historyEntries}
 *   onRestore={(payload) => console.log(payload)}
 *   onClear={() => console.log('cleared')}
 *   onClose={() => console.log('closed')}
 * />
 * ```
 *
 * @param {HistoryEntry[]} history - Array of historical payload entries to display
 * @param {(payload: string) => void} onRestore - Callback function triggered when a history entry is restored, receives the payload string
 * @param {() => void} onClear - Callback function triggered when the Clear button is clicked to remove all history
 * @param {() => void} onClose - Callback function triggered when the dropdown should close (e.g., on outside click or restore)
 *
 * @returns {JSX.Element} A positioned dropdown menu displaying payload history with restore and clear functionality
 */
export function HistoryDropdown({
  history,
  onRestore,
  onClear,
  onClose,
}: {
  history: HistoryEntry[];
  onRestore: (payload: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-72 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Payload History
        </span>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            Clear
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="px-3 py-5 text-center">
          <p className="text-[11px] text-zinc-600">No history yet</p>
          <p className="text-[10px] text-zinc-700 mt-0.5">
            Sent payloads appear here
          </p>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {history.map((entry) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => {
                onRestore(entry.payload);
                onClose();
              }}
              className="w-full flex flex-col gap-1 px-3 py-2.5 hover:bg-zinc-800/60 transition-colors text-left border-b border-zinc-800/40 last:border-0 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {relativeTime(entry.sentAt)}
                </span>
                <span className="text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Restore →
                </span>
              </div>
              <pre className="text-[10px] font-mono text-zinc-400 truncate max-w-full overflow-hidden">
                {entry.payload.replace(/\s+/g, " ").slice(0, 80)}
              </pre>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
