/**
 * Renders a shimmer (skeleton) loading state for a panel component.
 *
 * This component displays a placeholder UI with animated pulsing elements
 * that simulate the layout of a panel while content is loading.
 *
 * The shimmer includes:
 * - A header section with a title and badge
 * - A subtitle line
 * - Three filter/action buttons
 * - A content area with multiple placeholder lines
 * - A footer button
 *
 * @returns {JSX.Element} A div containing the shimmer loading skeleton with flex layout
 *
 * @example
 * ```tsx
 * <PanelShimmer />
 * ```
 */
export function PanelShimmer() {
  return (
    <div className="flex flex-col h-full p-5 gap-5 overflow-hidden">
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-36 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="h-3 w-52 rounded bg-zinc-800/70 animate-pulse" />
      </div>
      <div className="flex gap-2 shrink-0">
        {[70, 90, 60].map((w, i) => (
          <div
            key={i}
            className="h-6 rounded-lg bg-zinc-800 animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-zinc-800 animate-pulse"
              style={{ width: `${30 + (i % 4) * 15}%` }}
            />
          ))}
        </div>
      </div>
      <div className="h-11 w-full rounded-xl bg-zinc-800 animate-pulse shrink-0" />
    </div>
  );
}
