import { ArrowUp, Copy, FileJson } from "lucide-react";
import { useEffect, useRef } from "react";
import { downloadJson } from "@/lib/utils";
import type { Log } from "@/store/wsgate.store";

/**
 * ExportMenu component for exporting logs in various formats.
 *
 * Provides a dropdown menu with options to:
 * - Download all logs as JSON
 * - Download only emitted events as JSON
 * - Copy all logs to clipboard
 *
 * The menu automatically closes when clicking outside of it.
 *
 * @component
 * @param {Object} props - The component props
 * @param {Log[]} props.logs - Array of log entries to export
 * @param {() => void} props.onClose - Callback function triggered when the menu should close
 *
 * @returns {JSX.Element} A dropdown menu positioned absolutely with export options
 *
 * @example
 * const [logs, setLogs] = useState<Log[]>([]);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * return (
 *   isOpen && <ExportMenu logs={logs} onClose={() => setIsOpen(false)} />
 * );
 */
export function ExportMenu({
  logs,
  onClose,
}: {
  logs: Log[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const items = [
    {
      icon: <FileJson className="w-3 h-3" />,
      label: "Download all (.json)",
      fn() {
        downloadJson(
          logs.map((l) => ({
            event: l.event,
            direction: l.direction,
            data: l.data,
            ack: l.ack,
          })),
          `wsgate-log-${Date.now()}.json`,
        );
        onClose();
      },
    },
    {
      icon: <ArrowUp className="w-3 h-3 text-blue-400" />,
      label: "Download emits only",
      fn() {
        downloadJson(
          logs
            .filter((l) => l.direction === "out")
            .map((l) => ({ event: l.event, data: l.data, ack: l.ack })),
          `wsgate-emit-${Date.now()}.json`,
        );
        onClose();
      },
    },
    {
      icon: <Copy className="w-3 h-3" />,
      label: "Copy all to clipboard",
      fn() {
        navigator.clipboard.writeText(
          JSON.stringify(
            logs.map((l) => ({
              event: l.event,
              direction: l.direction,
              data: l.data,
            })),
            null,
            2,
          ),
        );
        onClose();
      },
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-52 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-zinc-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Export
        </span>
      </div>
      <div className="flex flex-col py-1">
        {items.map((item) => (
          <button
            type="button"
            key={item.label}
            onClick={item.fn}
            className="flex items-center gap-2.5 px-3 py-2 text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors text-left"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
