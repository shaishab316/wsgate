import { Pin } from "lucide-react";

/**
 * Displays a separator component for pinned items with a count indicator.
 *
 * @accessibility
 * - Separator has role="status" to announce pinned count to screen readers
 * - aria-label describes what the separator indicates
 * - Decorative icon is marked with aria-hidden
 * - Clear visual distinction with color and text
 *
 * @component
 * @param {Object} props - The component props
 * @param {number} props.count - The number of pinned items to display
 * @returns {JSX.Element} A separator element featuring a pin icon, "Pinned" label with count, and a horizontal line
 *
 * @example
 * <PinnedSeparator count={5} />
 */
export function PinnedSeparator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1" role="status" aria-label={`${count} pinned items`}>
      <Pin className="w-2.5 h-2.5 text-amber-500/60" aria-hidden="true" />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500/50">
        Pinned ({count})
      </span>
      <div className="flex-1 h-px bg-amber-500/10" />
    </div>
  );
}
