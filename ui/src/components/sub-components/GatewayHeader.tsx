import { ChevronRight, Layers } from "lucide-react";
import { Badge } from "../ui/badge";

/**
 * Collapsible section header for grouping events by gateway name.
 * Nested under a namespace section.
 *
 * @param name      - The gateway class name.
 * @param count     - Number of events in this group.
 * @param collapsed - Whether the section is collapsed.
 * @param onToggle  - Toggles collapsed state.
 */
export function GatewayHeader({
  name,
  count,
  collapsed,
  onToggle,
}: {
  name: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-1.5 mt-2 ml-0 group"
    >
      <Layers className="w-3 h-3 text-zinc-600 shrink-0" />
      <span className="flex-1 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-widest truncate">
        {name}
      </span>
      <Badge
        variant="outline"
        className="text-[9px] border-zinc-700 text-zinc-600 px-1.5 h-4"
      >
        {count}
      </Badge>
      <ChevronRight
        className={`w-3 h-3 text-zinc-600 transition-transform duration-200 ${
          collapsed ? "" : "rotate-90"
        }`}
      />
    </button>
  );
}
