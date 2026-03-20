import { Activity } from "lucide-react";

export function StreamSeparator() {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <Activity className="w-2.5 h-2.5 text-zinc-600" />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-700">
        Stream
      </span>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  );
}
