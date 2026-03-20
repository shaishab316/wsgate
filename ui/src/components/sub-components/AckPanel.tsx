import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CopyButton } from "./CopyButton";

/**
 * Displays an acknowledgment (ACK) response panel with expandable content.
 *
 * The component renders a collapsible panel showing ACK data with:
 * - A header displaying "ACK Response" label and emit count
 * - A pulsing indicator dot
 * - A copy button for the formatted ACK content
 * - An expand/collapse chevron icon
 * - Expandable pre-formatted JSON content
 *
 * @component
 * @param {Object} props - The component props
 * @param {unknown} props.ack - The acknowledgment data to display (can be any type)
 * @param {number} props.emitCount - The sequential number of this ACK emission
 * @returns {React.ReactElement | null} The rendered ACK panel, or null if ack is undefined/null
 *
 * @example
 * // Basic usage
 * <AckPanel ack={{ status: 'ok', id: 123 }} emitCount={1} />
 *
 * @remarks
 * - The panel is expanded by default
 * - JSON stringification is attempted; falls back to String() if it fails
 * - The expand/collapse is keyboard accessible (Enter/Space keys)
 * - Styled with Tailwind CSS using emerald color scheme
 */
export function AckPanel({
  ack,
  emitCount,
}: {
  ack: unknown;
  emitCount: number;
}): React.ReactElement | null {
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
