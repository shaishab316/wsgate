import { Search } from "lucide-react";

/**
 * Shown when events load successfully but none match the search query.
 *
 * @param onClear - Clears the search input.
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
            onClick={onClear}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
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
