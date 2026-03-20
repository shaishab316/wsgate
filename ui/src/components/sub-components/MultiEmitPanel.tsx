import { Loader2, Repeat2, X } from "lucide-react";
import { useRef, useState } from "react";

export interface MultiEmitResult {
  index: number;
  ack: unknown;
  sentAt: string;
  ok: boolean;
}

export function MultiEmitPanel({
  onMultiEmit,
  disabled,
}: {
  onMultiEmit: (count: number, delayMs: number) => Promise<MultiEmitResult[]>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [count, setCount] = useState<number>(5);
  const [delay, setDelay] = useState<number>(200);
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<MultiEmitResult[]>([]);
  const cancelRef = useRef<boolean>(false);

  async function run() {
    setRunning(true);
    setResults([]);
    cancelRef.current = false;
    const res = await onMultiEmit(count, delay);
    if (!cancelRef.current) setResults(res);
    setRunning(false);
  }

  const successCount = results.filter((r) => r.ok).length;
  return (
    <div className="shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-[10px] transition-all px-2 py-1 rounded-md border ${open ? "text-violet-400 border-violet-500/30 bg-violet-500/5" : "text-zinc-600 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50"}`}
      >
        <Repeat2 className="w-3 h-3" />
        Multi
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/3 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-zinc-600">Count</label>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-14 text-[11px] font-mono text-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-zinc-600">Delay (ms)</label>
              <input
                type="number"
                min={0}
                max={5000}
                step={50}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-16 text-[11px] font-mono text-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>
            <div className="flex-1" />
            {running ? (
              <button
                onClick={() => {
                  cancelRef.current = true;
                  setRunning(false);
                }}
                className="flex items-center gap-1.5 text-[10px] text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            ) : (
              <button
                onClick={run}
                disabled={disabled}
                className="flex items-center gap-1.5 text-[10px] text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 transition-colors"
              >
                <Repeat2 className="w-3 h-3" />
                Run ×{count}
              </button>
            )}
          </div>
          {running && (
            <div className="flex items-center gap-2 px-3 pb-2.5">
              <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
              <span className="text-[10px] text-zinc-500">
                Sending {count} emits…
              </span>
            </div>
          )}
          {results.length > 0 && !running && (
            <div className="border-t border-violet-500/10 px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">
                  Results:{" "}
                  <span className="text-emerald-400">{successCount} ok</span>
                  {successCount < results.length && (
                    <span className="text-red-400 ml-1">
                      {results.length - successCount} failed
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setResults([])}
                  className="text-[9px] text-zinc-700 hover:text-zinc-400"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {results.map((r) => (
                  <span
                    key={r.index}
                    title={`#${r.index + 1}`}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${r.ok ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8" : "text-red-400 border-red-500/25 bg-red-500/8"}`}
                  >
                    {r.index + 1}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
