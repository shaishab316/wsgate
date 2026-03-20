import { Pin } from "lucide-react";

export function PinnedSeparator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <Pin className="w-2.5 h-2.5 text-amber-500/60" />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500/50">
        Pinned ({count})
      </span>
      <div className="flex-1 h-px bg-amber-500/10" />
    </div>
  );
}
