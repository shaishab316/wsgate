import { Search } from "lucide-react";

/**
 * Displays an empty state message when search returns no results.
 *
 * This component is shown when events load successfully but none match
 * the current search query. It provides helpful information to the user
 * and offers an accessible way to clear the search filter.
 *
 * @accessibility
 * - Clear button has proper aria-label for screen readers
 * - Focus indicators for keyboard navigation
 * - Semantic button element for assistive technologies
 *
 * @component
 * @example
 * ```tsx
 * <EmptySearch onClear={() => setSearchQuery('')} />
 * ```
 *
 * @param {Object} props - Component props
 * @param {() => void} props.onClear - Callback function to clear the search input
 *
 * @returns {JSX.Element} An accessible empty state component with messaging and clear action
 */
export function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 gap-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-zinc-800 flex items-center justify-center">
        <Search className="w-5 h-5 text-zinc-600" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-zinc-300">No results found</p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Try searching for different keywords or{" "}
        <button
            type="button"
            onClick={onClear}
            aria-label="Clear search filter"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium focus-visible:outline-none focus-visible:rounded focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:px-1"
          >
            clear your search
          </button>
        </p>
      </div>
      <div className="text-[10px] text-zinc-600 pt-2">
        <p>📝 Tip: Search by event name or description</p>
      </div>
    </div>
  );
}
