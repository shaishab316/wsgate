import { CircleSlash, ScrollText } from "lucide-react";

/**
 * Renders an empty state component for the log display.
 *
 * Shows a centered message with an icon indicating either no events or no matching events
 * based on the filter state. The component displays different icons and messages depending
 * on whether filters are applied.
 *
 * @param {Object} props - The component props
 * @param {boolean} props.hasFilter - Whether a filter is currently applied to the logs.
 *                                    If true, displays "no matching events" message with CircleSlash icon.
 *                                    If false, displays "no events yet" message with ScrollText icon.
 *
 * @returns {JSX.Element} The empty state UI component
 *
 * @example
 * // Display when no filters are applied
 * <LogEmptyState hasFilter={false} />
 *
 * @example
 * // Display when filters are applied but no matches found
 * <LogEmptyState hasFilter={true} />
 */
export function LogEmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 select-none py-16">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        {hasFilter ? (
          <CircleSlash className="w-5 h-5 text-zinc-700" />
        ) : (
          <ScrollText className="w-5 h-5 text-zinc-700" />
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-medium text-zinc-500">
          {hasFilter ? "No matching events" : "No events yet"}
        </p>
        <p className="text-[10px] text-zinc-700 text-center leading-relaxed">
          {hasFilter
            ? "Try adjusting your filter"
            : "Emit an event to see it here"}
        </p>
      </div>
    </div>
  );
}
