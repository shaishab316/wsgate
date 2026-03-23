/**
 * Icon Button — Reusable button component for icon-only actions.
 *
 * Used throughout the UI for toggling, filtering, and control actions.
 * Supports active/inactive states with full customization via Tailwind classes.
 *
 * @example
 * ```tsx
 * <IconBtn
 *   title="Toggle panel"
 *   active={isPanelOpen}
 *   onClick={() => setIsPanelOpen(!isPanelOpen)}
 *   activeClass="text-emerald-400 border-emerald-500/20 bg-emerald-500/8"
 * >
 *   <Settings className="w-4 h-4" />
 * </IconBtn>
 * ```
 *
 * @param onClick - Callback fired when button is clicked
 * @param title - Tooltip text shown on hover (also used as aria-label)
 * @param active - Whether button is in active state (shows activeClass)
 * @param activeClass - Tailwind classes applied when active. Default: blue theme
 * @param children - Icon or element to render inside button (usually lucide-react icon)
 */
export function IconBtn({
  onClick,
  title,
  active,
  activeClass = "text-blue-400 border-blue-500/20 bg-blue-500/8",
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  activeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md border transition-all ${
        active
          ? activeClass
          : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
