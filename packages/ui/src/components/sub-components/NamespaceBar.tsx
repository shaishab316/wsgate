import { Network } from "lucide-react";
import { namespaceColor } from "@/lib/utils";
import type { WsEvent } from "@/types/ws-event";

/**
 * NamespaceBar - A filterable namespace selector component
 *
 * Displays a horizontal scrollable bar of namespace pills that allow users to filter events
 * by namespace. Shows an "All" pill to view all events and individual pills for each namespace
 * with color-coded indicators and event counts.
 *
 * @accessibility
 * - All filter buttons have descriptive aria-labels
 * - "All" button indicates current selection with aria-pressed
 * - Each namespace button has aria-label with namespace and count information
 * - Focus indicators visible on all interactive elements
 * - Decorative icon marked with aria-hidden
 * - Decorative dots marked with aria-hidden
 *
 * @component
 * @example
 * ```tsx
 * <NamespaceBar
 *   namespaces={['/socket', '/api', '/chat']}
 *   active="/socket"
 *   allEvents={events}
 *   onSelect={(ns) => setActiveNamespace(ns)}
 * />
 * ```
 *
 * @param {Object} props - Component props
 * @param {string[]} props.namespaces - Array of namespace identifiers to display as filter pills
 * @param {string | null} props.active - Currently selected namespace, or null if viewing all events
 * @param {WsEvent[]} props.allEvents - Array of all WebSocket events used to calculate counts per namespace
 * @param {(ns: string | null) => void} props.onSelect - Callback fired when a namespace pill is clicked. Passes null to show all events or the namespace string to filter
 *
 * @returns {React.ReactElement | null} The namespace filter bar component, or null if fewer than 2 namespaces exist
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
        <Network className="w-2.5 h-2.5" aria-hidden="true" />
        Namespace
      </p>

      {/* Scrollable pill row — hidden scrollbar for cleanliness */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* "All" pill */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label={`Show all events (${allEvents.length} total)`}
          aria-pressed={active === null}
          className={`inline-flex items-center gap-1.5 shrink-0 h-6 px-2.5 rounded-full text-[10px] font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 ${
            active === null
              ? "border-blue-400/60 text-blue-300 bg-blue-500/10"
              : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          {active === null && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" aria-hidden="true" />
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
              type="button"
              key={ns}
              onClick={() => onSelect(isActive ? null : ns)}
              aria-label={`Filter by namespace: ${ns} (${count} events)`}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 shrink-0 h-6 px-2.5 rounded-full text-[10px] font-mono font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 ${
                isActive ? palette.active : palette.idle
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-opacity ${palette.dot} ${
                  isActive ? "opacity-100" : "opacity-50"
                }`}
                aria-hidden="true"
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
