/**
 * EditorShimmer component that displays a loading skeleton screen for an editor.
 *
 * Renders a shimmer/skeleton loading animation with multiple pulsing bars of varying widths
 * to indicate content is being loaded. The component uses Tailwind CSS for styling with
 * a dark theme appearance featuring rounded corners and a border.
 *
 * @returns {JSX.Element} A div element containing animated skeleton bars with pulse animation
 *
 * @example
 * ```tsx
 * <EditorShimmer />
 * ```
 */
export function EditorShimmer() {
  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Ignore this because it's a static list of skeleton bars that won't change
          key={i}
          className="h-3 rounded-full bg-zinc-800 animate-pulse"
          style={{ width: `${30 + (i % 4) * 15}%` }}
        />
      ))}
    </div>
  );
}
