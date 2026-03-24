import { Timer } from "lucide-react";
import { formatLatency } from "@/lib/utils";

/**
 * Displays a latency indicator with color-coded performance feedback.
 *
 * Determines the color styling based on latency in milliseconds:
 * - Green (emerald): < 100ms — Excellent latency
 * - Yellow (amber): 100-499ms — Acceptable latency
 * - Red: ≥ 500ms — Poor latency
 *
 * @accessibility
 * - Uses both color and formatted text to convey latency status
 * - Accessible title/aria-label describes the latency value clearly
 * - Timer icon is decorative with aria-hidden
 * - High contrast text for readability
 *
 * @param {number} ms - The latency value in milliseconds
 * @returns {JSX.Element} A styled chip displaying latency with icon and formatted time
 */
export function LatencyChip({ ms }: { ms: number }) {
  const color =
    ms < 100
      ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8"
      : ms < 500
        ? "text-amber-400 border-amber-500/25 bg-amber-500/8"
        : "text-red-400 border-red-500/25 bg-red-500/8";
  return (
    <span
      aria-label={`ACK latency: ${ms} milliseconds`}
      title={`ACK latency: ${ms}ms`}
      className={`inline-flex items-center gap-1 text-[9px] font-mono border rounded-md px-1.5 py-0.5 shrink-0 ${color}`}
    >
      <Timer className="w-2 h-2" aria-hidden="true" />
      {formatLatency(ms)}
    </span>
  );
}
