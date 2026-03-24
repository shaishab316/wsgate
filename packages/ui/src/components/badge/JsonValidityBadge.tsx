import { CircleDot } from "lucide-react";
import { useMemo } from "react";
import { resolveFakerVars } from "@/lib/faker";
import { tryParseJson } from "@/lib/utils";

/**
 * JsonValidityBadge — Validates JSON payloads and indicates validity status.
 *
 * This badge component takes a string payload, attempts to parse it as JSON (after resolving any faker variables), and displays a badge indicating whether the JSON is valid or invalid. It uses a green color scheme for valid JSON and red for invalid, along with a small dot icon for quick visual identification. The badge only renders if the payload is non-empty, ensuring it appears only when relevant.
 * Example usage:
 * ```tsx
 * <JsonValidityBadge payload='{"name": "Alice", "age": 30}' />
 * // Renders a green badge with "Valid"
 * <JsonValidityBadge payload='{"name": "Alice", "age": 30' />
 * // Renders a red badge with "Invalid"
 * ```
 *
 * @param payload - The string content to validate as JSON
 * @returns A React element displaying the validity badge, or null if the payload is empty
 */
export function JsonValidityBadge({ payload }: { payload: string }) {
  const isValid = useMemo<boolean>(
    () => tryParseJson(resolveFakerVars(payload)) !== null,
    [payload],
  );
  if (!payload.trim()) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-mono font-semibold rounded-md px-1.5 py-0.5 border transition-all duration-200 ${isValid ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8" : "text-red-400 border-red-500/25 bg-red-500/8"}`}
    >
      <CircleDot className="w-2 h-2" />
      {isValid ? "Valid" : "Invalid"}
    </span>
  );
}
