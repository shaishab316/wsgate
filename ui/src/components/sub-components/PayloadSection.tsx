import { safeStringify } from "@/lib/utils";
import { JsonViewer } from "./JsonViewer";
import { CopyButton } from "./CopyButton";

/**
 * PayloadSection — label bar + JsonViewer.
 * The <pre> inside sets its own height; the card grows to fit.
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
    <div className="border-t border-white/5">
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
