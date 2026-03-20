import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CopyButton } from "./CopyButton";

export function AckPanel({
  ack,
  emitCount,
}: {
  ack: unknown;
  emitCount: number;
}) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const formatted = useMemo<string | null>(() => {
    if (ack === undefined || ack === null) return null;
    try {
      return JSON.stringify(ack, null, 2);
    } catch {
      return String(ack);
    }
  }, [ack]);
  if (formatted === null) return null;
  return (
    <div className="flex flex-col gap-0 rounded-xl border border-emerald-500/20 bg-emerald-500/3 overflow-hidden shrink-0">
      <div
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setExpanded((v) => !v);
          }
        }}
        className="flex items-center justify-between px-3 py-2 hover:bg-emerald-500/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">
            ACK Response
          </span>
          <span className="text-[9px] text-zinc-600 font-mono">
            #{emitCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={formatted} />
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-zinc-600" />
          ) : (
            <ChevronDown className="w-3 h-3 text-zinc-600" />
          )}
        </div>
      </div>
      {expanded && (
        <pre className="text-[11px] font-mono text-emerald-300/80 px-3 py-2.5 overflow-x-auto border-t border-emerald-500/10 bg-zinc-950/40 max-h-36">
          {formatted}
        </pre>
      )}
    </div>
  );
}
