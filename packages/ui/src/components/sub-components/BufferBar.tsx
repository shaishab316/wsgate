import { LOG_BUFFER_LIMIT } from "./Config";

/**
 * A visual progress bar component that displays the current buffer usage relative to the maximum log buffer limit.
 *
 * @component
 * @param {Object} props - The component props
 * @param {number} props.count - The current number of items in the buffer
 * @returns {JSX.Element} A buffer progress bar with usage percentage and warning indicator
 *
 * @example
 * ```tsx
 * <BufferBar count={450} />
 * ```
 *
 * @remarks
 * - Displays a filled progress bar that fills up to 100% as the buffer approaches the limit
 * - The bar and text turn amber/orange when buffer usage reaches 80% or higher as a warning indicator
 * - Shows a count display in the format "current/limit" (e.g., "450/500")
 */
export function BufferBar({ count }: { count: number }) {
  const pct = Math.min((count / LOG_BUFFER_LIMIT) * 100, 100);
  const warn = pct >= 80;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-t border-zinc-800/40 shrink-0">
      <div className="flex-1 h-0.5 rounded-full bg-zinc-900 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${warn ? "bg-amber-500/50" : "bg-zinc-700"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[9px] font-mono shrink-0 ${warn ? "text-amber-500/70" : "text-zinc-700"}`}
      >
        {count}/{LOG_BUFFER_LIMIT}
      </span>
    </div>
  );
}
