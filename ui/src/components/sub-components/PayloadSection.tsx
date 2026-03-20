import { safeStringify } from "@/lib/utils";
import { JsonViewer } from "./JsonViewer";
import { CopyButton } from "./CopyButton";

/**
 * Displays a collapsible payload section with formatted JSON data and copy functionality.
 *
 * @component
 * @param {Object} props - The component props
 * @param {unknown} props.data - The data object to be displayed in JSON format
 * @param {string} props.label - The label text displayed at the top of the section
 * @param {string} props.labelColor - Tailwind CSS color class for styling the label
 * @param {React.ReactNode} [props.extra] - Optional additional content displayed next to the label
 *
 * @returns {React.ReactElement} A section component containing a header with label and copy button, and a body with JSON viewer
 *
 * @example
 * <PayloadSection
 *   data={{ id: 1, name: 'test' }}
 *   label="Response"
 *   labelColor="text-green-500"
 *   extra={<Badge>Success</Badge>}
 * />
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
