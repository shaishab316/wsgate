import { getNamespaceDisplayName } from "@/lib/utils";
import type { NAMESPACE_PALETTE } from "./Config";
import { Badge } from "../ui/badge";
import { ChevronRight } from "lucide-react";

/**
 * Namespace section header — prominently displays the namespace
 * with icon, display name, and total event count.
 *
 * @param ns           - The namespace string (e.g. `'/chat'`).
 * @param count        - Total events in this namespace.
 * @param color        - Color config from palette.
 * @param isExpanded   - Whether this namespace section is expanded.
 * @param onToggle     - Called to toggle expansion.
 */
export function NamespaceSectionHeader({
  ns,
  count,
  color,
  isExpanded,
  onToggle,
}: {
  ns: string;
  count: number;
  color: (typeof NAMESPACE_PALETTE)[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const displayName = getNamespaceDisplayName(ns);

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2.5 mt-3 first:mt-2 mb-1 group transition-colors hover:bg-zinc-800/30"
    >
      {/* Namespace dot indicator */}
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />

      {/* Namespace name */}
      <span className="flex-1 text-left text-[11px] font-bold text-zinc-100 uppercase tracking-widest truncate">
        {displayName}
      </span>

      {/* Event count badge */}
      <Badge
        variant="outline"
        className="text-[9px] border-zinc-700 text-zinc-500 px-1.5 h-4 shrink-0"
      >
        {count}
      </Badge>

      {/* Expand / collapse chevron */}
      <ChevronRight
        className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 shrink-0 ${
          isExpanded ? "rotate-90" : ""
        }`}
      />
    </button>
  );
}
