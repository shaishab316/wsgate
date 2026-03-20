import { formatLatency } from "@/lib/utils";
import { Timer } from "lucide-react";

export function LatencyChip({ ms }: { ms: number }) {
  const color =
    ms < 100
      ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8"
      : ms < 500
        ? "text-amber-400 border-amber-500/25 bg-amber-500/8"
        : "text-red-400 border-red-500/25 bg-red-500/8";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-mono border rounded-md px-1.5 py-0.5 shrink-0 ${color}`}
      title={`ACK latency: ${ms}ms`}
    >
      <Timer className="w-2 h-2" />
      {formatLatency(ms)}
    </span>
  );
}
