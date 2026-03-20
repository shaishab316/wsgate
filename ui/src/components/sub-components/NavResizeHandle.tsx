import { PanelResizeHandle } from "react-resizable-panels";

/**
 * NavResizeHandle Component
 *
 * A visual resize handle for panel resizing with interactive feedback.
 * Displays three dots that change appearance on hover and active states.
 *
 * @component
 * @returns {JSX.Element} A PanelResizeHandle element with styled resize indicator dots
 *
 * @example
 * ```tsx
 * <NavResizeHandle />
 * ```
 *
 * @remarks
 * - Height is fixed at 36px
 * - Cursor changes to column-resize on hover
 * - Opacity transitions from 30% (default) to 100% (hover)
 * - Dots change color from zinc-400 to blue-400 on hover, and blue-300 when active
 * - Uses Tailwind CSS for styling
 */
export function NavResizeHandle() {
  return (
    <PanelResizeHandle
      style={{ height: "36px" }}
      className="group relative w-3 flex items-center justify-center cursor-col-resize shrink-0"
    >
      <div className="flex flex-col gap-0.75 opacity-30 group-hover:opacity-100 transition-opacity duration-150">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-0.75 rounded-full bg-zinc-400 group-hover:bg-blue-400 group-active:bg-blue-300 transition-colors duration-150"
          />
        ))}
      </div>
    </PanelResizeHandle>
  );
}
