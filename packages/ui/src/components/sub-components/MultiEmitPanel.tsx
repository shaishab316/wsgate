import { Loader2, Repeat2, X } from "lucide-react";
import { useRef, useState } from "react";

export interface MultiEmitResult {
  index: number;
  ack: unknown;
  sentAt: string;
  ok: boolean;
}

/**
 * A panel component for emitting multiple messages with configurable count and delay.
 *
 * Provides a collapsible UI for sending batch emissions with real-time progress tracking
 * and result visualization. Supports cancellation of ongoing operations.
 *
 * @accessibility
 * - Toggle button has aria-label and aria-expanded indicating panel state
 * - Count and delay inputs have accessible labels and focus rings
 * - Run/Cancel buttons have aria-label and focus indicators
 * - Results display has accessible structure with clear feedback
 * - Clear button has focus ring for keyboard navigation
 * - Loader icon is decorative (aria-hidden)
 * - Progress status is announced via text content
 *
 * @component
 * @example
 * ```tsx
 * const handleMultiEmit = async (count: number, delayMs: number) => {
 *   // Implementation
 *   return results;
 * };
 *
 * <MultiEmitPanel
 *   onMultiEmit={handleMultiEmit}
 *   disabled={false}
 * />
 * ```
 *
 * @param {Object} props - The component props
 * @param {Function} props.onMultiEmit - Async callback to handle multiple emissions
 * @param {number} props.onMultiEmit.count - Number of times to emit
 * @param {number} props.onMultiEmit.delayMs - Delay in milliseconds between emissions
 * @param {Promise<MultiEmitResult[]>} props.onMultiEmit.return - Array of emission results
 * @param {boolean} props.disabled - Whether the run button should be disabled
 *
 * @returns {React.ReactElement} The rendered multi-emit panel component
 */
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
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle multi-emit panel"
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-[10px] transition-all px-2 py-1 rounded-md border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 ${open ? "text-violet-400 border-violet-500/30 bg-violet-500/5" : "text-zinc-600 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50"}`}
      >
        <Repeat2 className="w-3 h-3" aria-hidden="true" />
        Multi
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/3 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <label
                className="text-[10px] text-zinc-600"
                htmlFor="multi-count"
              >
                Count
              </label>
              <input
                id="multi-count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-14 text-[11px] font-mono text-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 outline-none focus:border-zinc-600 focus-visible:ring-1 focus-visible:ring-blue-500/40"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label
                className="text-[10px] text-zinc-600"
                htmlFor="multi-delay"
              >
                Delay (ms)
              </label>
              <input
                id="multi-delay"
                type="number"
                min={0}
                max={5000}
                step={50}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-16 text-[11px] font-mono text-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 outline-none focus:border-zinc-600 focus-visible:ring-1 focus-visible:ring-blue-500/40"
              />
            </div>
            <div className="flex-1" />
            {running ? (
              <button
                type="button"
                onClick={() => {
                  cancelRef.current = true;
                  setRunning(false);
                }}
                aria-label="Cancel batch emission"
                className="flex items-center gap-1.5 text-[10px] text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={run}
                disabled={disabled}
                aria-label={`Run ${count} batch emissions with ${delay}ms delay between each`}
                className="flex items-center gap-1.5 text-[10px] text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40"
              >
                <Repeat2 className="w-3 h-3" aria-hidden="true" />
                Run ×{count}
              </button>
            )}
          </div>
          {running && (
            <div className="flex items-center gap-2 px-3 pb-2.5" role="status" aria-live="polite">
              <Loader2 className="w-3 h-3 text-violet-400 animate-spin" aria-hidden="true" />
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
                  type="button"
                  onClick={() => setResults([])}
                  aria-label="Clear results"
                  className="text-[9px] text-zinc-700 hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40"
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
