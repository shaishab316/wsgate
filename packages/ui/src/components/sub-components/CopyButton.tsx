import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * Copy Button — Icon button that copies text to clipboard with confirmation.
 *
 * Displays a Copy icon by default. On click, copies the provided text to
 * clipboard and shows a Check icon for 1.5 seconds before reverting.
 * Used for quick access to event names, payloads, and code samples.
 *
 * @example
 * ```tsx
 * <CopyButton text="user.created" />
 * // On click → clipboard gets "user.created" → shows Check icon
 * ```
 *
 * @param text - String content to copy to clipboard on button click
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
        copied
          ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15"
          : "border-zinc-700/50 text-zinc-400 bg-zinc-900/30 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/60"
      }`}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-400" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3.5 text-zinc-500" />
          Copy
        </>
      )}
    </button>
  );
}
