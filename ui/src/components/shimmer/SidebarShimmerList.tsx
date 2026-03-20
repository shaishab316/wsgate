/**
 * SidebarShimmerList component
 *
 * Renders a shimmer (skeleton loading) list for the sidebar with animated placeholder elements.
 * Displays 7 rows of placeholder items, each containing:
 * - An icon placeholder
 * - A name/title placeholder with variable width
 * - A badge placeholder
 * - A description placeholder with variable width
 *
 * All elements use `animate-pulse` for a smooth loading animation effect.
 *
 * @returns {JSX.Element} A div containing 7 shimmer list items with animated placeholders
 *
 * @example
 * ```tsx
 * <SidebarShimmerList />
 * ```
 */
export function SidebarShimmerList() {
  return (
    <div className="flex flex-col py-2 px-2 gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg">
          {/* Icon + name + badge */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-zinc-800 animate-pulse shrink-0" />
            <div
              className="h-3 rounded bg-zinc-800 animate-pulse flex-1"
              style={{ width: `${45 + (i % 3) * 15}%` }}
            />
            <div className="h-4 w-10 rounded-full bg-zinc-800 animate-pulse shrink-0" />
          </div>
          {/* Description */}
          <div
            className="h-2.5 rounded bg-zinc-800/60 animate-pulse ml-6"
            style={{ width: `${55 + (i % 2) * 20}%` }}
          />
        </div>
      ))}
    </div>
  );
}
