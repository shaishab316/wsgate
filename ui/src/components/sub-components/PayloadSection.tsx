import { safeStringify } from "@/lib/utils";
import { JsonViewer } from "./JsonViewer";
import { CopyButton } from "./CopyButton";

/**
 * PayloadSection — Labeled JSON payload viewer with copy button.
 *
 * Renders a collapsible section displaying JSON data with:
 * - Header bar with label and optional extra content
 * - Syntax-highlighted JSON viewer in a dark VSCode-like theme
 * - Copy button for quick clipboard access
 *
 * The component is theme-aware (light/dark mode) and uses a `<pre>` tag
 * for height-agnostic rendering — it expands exactly to content size,
 * avoiding Monaco Editor's height calculation issues and significantly
 * reducing bundle size (~100× lighter for event logs).
 *
 * @example
 * ```tsx
 * <PayloadSection
 *   label="Response"
 *   labelColor="text-emerald-400"
 *   data={{ userId: "123", success: true }}
 *   extra={<Badge>ack</Badge>}
 * />
 * ```
 *
 * @param data - Any JSON-serializable object to display
 * @param label - Header label (uppercase, displayed as title)
 * @param labelColor - Tailwind text color class for label (e.g., "text-blue-400")
 * @param extra - Optional React node rendered next to label (badges, chips, etc.)
 */
export function PayloadSection({
  data,
  label,
  labelColor,
  extra,
}: {
  data: unknown;
  label: string;
  labelColor: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="border-t border-white/5 invert dark:invert-0">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/20">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-widest font-semibold ${labelColor}`}
          >
            {label}
          </span>
          {extra}
        </div>
        <CopyButton text={safeStringify(data)} />
      </div>
      <div className="bg-zinc-950/60">
        <JsonViewer data={data} />
      </div>
    </div>
  );
}
