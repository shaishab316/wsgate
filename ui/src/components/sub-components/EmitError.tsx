/**
 * A dismissible error alert component that displays an error message with an icon and close button.
 *
 * @component
 * @example
 * const [error, setError] = useState<string | null>(null);
 * return (
 *   <EmitError
 *     message="Something went wrong"
 *     onDismiss={() => setError(null)}
 *   />
 * );
 *
 * @param {Object} props - The component props
 * @param {string} props.message - The error message to display
 * @param {() => void} props.onDismiss - Callback function triggered when the dismiss button is clicked
 * @returns {JSX.Element} A styled error alert container with icon, message, and dismiss button
 */
import { AlertCircle, X } from "lucide-react";

export function EmitError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 shrink-0">
      <div className="shrink-0 w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center">
        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
      </div>
      <p className="text-xs text-red-300 flex-1 font-mono">{message}</p>
      <button
        onClick={onDismiss}
        className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
