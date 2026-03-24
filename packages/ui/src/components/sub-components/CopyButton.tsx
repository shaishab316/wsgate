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
      className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          Copy
        </>
      )}
    </button>
  );
}
