import { namespaceColor } from "@/lib/utils";
import type { WsEvent } from "@/types/ws-event";
import { Network } from "lucide-react";

/**
 * Horizontal scrollable filter bar that lets the user isolate events
 * by Socket.IO namespace.
 *
 * Renders an "All" pill followed by one pill per unique namespace.
 * Each pill shows a colored dot, the namespace string, and a small
 * count badge for the number of events in that namespace.
 *
 * Selecting a namespace hides all events from other namespaces.
 * Selecting "All" clears the filter.
 *
 * Only rendered when there are two or more distinct namespaces —
 * there is nothing to filter with a single namespace.
 *
 * @param namespaces  - Sorted unique namespace list (`'/'` always first).
 * @param active      - Currently selected namespace, or `null` for All.
 * @param allEvents   - Full unfiltered event list (used for per-ns counts).
 * @param onSelect    - Called with the selected namespace or `null` for All.
 */
export function NamespaceBar({
  namespaces,
  active,
  allEvents,
  onSelect,
}: {
  namespaces: string[];
  active: string | null;
  allEvents: WsEvent[];
  onSelect: (ns: string | null) => void;
}) {
  // Don't render when there is nothing to filter
  if (namespaces.length < 2) return null;

  return (
    <div className="px-3 py-2 border-b border-zinc-800 shrink-0">
      {/* Section label */}
      <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5 flex items-center gap-1">
        <Network className="w-2.5 h-2.5" />
        Namespace
      </p>

      {/* Scrollable pill row — hidden scrollbar for cleanliness */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* "All" pill */}
        <button
          onClick={() => onSelect(null)}
          className={`inline-flex items-center gap-1.5 shrink-0 h-6 px-2.5 rounded-full text-[10px] font-medium border transition-all duration-150 ${
            active === null
              ? "border-blue-400/60 text-blue-300 bg-blue-500/10"
              : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          {active === null && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          )}
          All
          <span
            className={`text-[9px] px-1 rounded-sm font-mono transition-colors ${
              active === null ? "text-blue-400/80" : "text-zinc-600"
            }`}
          >
            {allEvents.length}
          </span>
        </button>

        {/* One pill per namespace */}
        {namespaces.map((ns) => {
          const palette = namespaceColor(ns, namespaces);
          const count = allEvents.filter(
            (e) => (e.namespace ?? "/") === ns,
          ).length;
          const isActive = active === ns;

          return (
            <button
              key={ns}
              onClick={() => onSelect(isActive ? null : ns)}
              className={`inline-flex items-center gap-1.5 shrink-0 h-6 px-2.5 rounded-full text-[10px] font-mono font-medium border transition-all duration-150 ${
                isActive ? palette.active : palette.idle
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-opacity ${palette.dot} ${
                  isActive ? "opacity-100" : "opacity-50"
                }`}
              />
              {ns}
              <span
                className={`text-[9px] px-1 rounded-sm font-mono transition-colors ${
                  isActive ? "opacity-70" : "text-zinc-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
