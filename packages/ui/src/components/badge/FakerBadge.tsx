import { hasFakerVars } from "@/lib/faker";
import { Sparkles } from "lucide-react";

/**
 * Faker Badge — Detects and indicates presence of faker variables in payloads.
 *
 * Scans the given payload string for patterns like {{\$variable}}. If found,
 * renders a small badge with a sparkles icon and count of faker variables.
 * Used in event lists and payload displays to quickly identify dynamic content.
 * Returns null if no faker variables are detected, ensuring it only appears when relevant.
 * Designed with a violet color scheme and subtle animation to stand out without overwhelming the UI.
 * Example usage:
 * ```tsx
 * <FakerBadge payload="Hello {{\$name}}, your order {{\$orderId}} is ready!" />
 * // Renders a badge with "2 faker vars"
 * ```
 *
 * @param payload - The string content to scan for faker variable patterns
 * @returns A React element displaying the faker badge if variables are found, or null if none are detected
 */
export function FakerBadge({ payload }: { payload: string }) {
  if (!hasFakerVars(payload)) return null;
  const count = (payload.match(/\{\{\$[^}]+\}\}/g) ?? []).length;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold rounded-md px-1.5 py-0.5 border text-violet-400 border-violet-500/30 bg-violet-500/8 animate-pulse">
      <Sparkles className="w-2 h-2" />
      {count} faker var{count !== 1 ? "s" : ""}
    </span>
  );
}
