import { ChevronRight, Layers } from "lucide-react";
import { Badge } from "../ui/badge";

/**
 * Renders a collapsible gateway header component with a toggle button.
 *
 * Provides an accessible collapsible section header with keyboard support,
 * visual feedback, and proper state indication for assistive technologies.
 *
 * @accessibility
 * - Button has clear `aria-label` describing collapse/expand action
 * - Chevron icon rotation indicates expanded state visually
 * - Focus-visible indicators for keyboard navigation
 * - Semantic button element for screen readers
 * - `aria-expanded` attribute reflects collapse state
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.name - The display name of the gateway
 * @param {number} props.count - The count badge value to display
 * @param {boolean} props.collapsed - Whether the gateway section is currently collapsed
 * @param {() => void} props.onToggle - Callback function invoked when the header is clicked to toggle collapse state
 * @returns {JSX.Element} An accessible button element containing gateway information with collapsible chevron icon
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
      type="button"
      onClick={onToggle}
      aria-label={`${collapsed ? "Expand" : "Collapse"} ${name} gateway (${count} events)`}
      aria-expanded={!collapsed}
      className="w-full flex items-center gap-2 px-3 py-1.5 mt-2 ml-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 rounded"
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
        aria-hidden="true"
      />
    </button>
  );
}
