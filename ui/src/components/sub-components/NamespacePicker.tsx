import { Check, GitBranch } from "lucide-react";
import { useState } from "react";

/**
 * A dropdown component for selecting a namespace from available options.
 *
 * @component
 * @example
 * ```tsx
 * <NamespacePicker
 *   selectedNamespace="/chat"
 *   availableNamespaces={["/", "/chat", "/admin"]}
 *   onSelect={(ns) => console.log(ns)}
 *   disabled={false}
 * />
 * ```
 *
 * @param {Object} props - The component props
 * @param {string | null} props.selectedNamespace - The currently selected namespace, or null if none selected
 * @param {string[]} props.availableNamespaces - Array of namespace paths available for selection
 * @param {(ns: string) => void} props.onSelect - Callback function invoked when a namespace is selected
 * @param {boolean} props.disabled - Whether the picker is disabled and non-interactive
 *
 * @returns {React.ReactElement | null} A dropdown button component that opens a menu of selectable namespaces, or null if no namespaces are available
 */
export function NamespacePicker({
  selectedNamespace,
  availableNamespaces,
  onSelect,
  disabled,
}: {
  selectedNamespace: string | null;
  availableNamespaces: string[];
  onSelect: (ns: string) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const getDisplayName = (ns: string) => {
    if (ns === "/") return "Global";
    return ns.slice(1).charAt(0).toUpperCase() + ns.slice(2);
  };

  const getColorClass = (ns: string, isActive: boolean) => {
    const colors: Record<string, { idle: string; active: string }> = {
      "/": {
        idle: "border-zinc-700 text-zinc-400 hover:text-zinc-300",
        active: "border-zinc-500 text-zinc-100 bg-zinc-800",
      },
      "/chat": {
        idle: "border-emerald-500/25 text-emerald-500/80 hover:text-emerald-400",
        active: "border-emerald-400 text-emerald-300 bg-emerald-500/15",
      },
      "/admin": {
        idle: "border-purple-500/25 text-purple-500/80 hover:text-purple-400",
        active: "border-purple-400 text-purple-300 bg-purple-500/15",
      },
    };

    const colorSet = colors[ns] || {
      idle: "border-amber-500/25 text-amber-500/80 hover:text-amber-400",
      active: "border-amber-400 text-amber-300 bg-amber-500/15",
    };

    return isActive ? colorSet.active : colorSet.idle;
  };

  if (availableNamespaces.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 h-9 px-3 rounded-lg border transition-all duration-200 ${
          disabled
            ? "border-zinc-800 opacity-50 cursor-not-allowed"
            : "border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100"
        }`}
      >
        <GitBranch className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-medium">
          {selectedNamespace
            ? getDisplayName(selectedNamespace)
            : "Select Namespace"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 z-50 overflow-hidden">
          {availableNamespaces.map((ns) => {
            const isActive = selectedNamespace === ns;
            return (
              <button
                key={ns}
                onClick={() => {
                  onSelect(ns);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium border-l-2 transition-all duration-150 ${getColorClass(
                  ns,
                  isActive,
                )} hover:bg-zinc-800/50`}
              >
                <span>{getDisplayName(ns)}</span>
                {isActive && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
