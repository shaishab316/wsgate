import { Diff } from "lucide-react";
import { useMemo } from "react";

/**
 * ModifiedBadge — Indicates if a JSON payload has been modified compared to its original skeleton.
 *
 * This badge component compares a given JSON payload against an original skeleton JSON string. If the payload has been modified (i.e., its parsed content differs from the skeleton), it renders a badge with a "modified" label and a diff icon. The comparison is done by parsing both strings as JSON and comparing their stringified forms, which allows for structural comparison rather than just string comparison. If the payload is identical to the skeleton, the badge does not render at all.
 * Example usage:
 * ```tsx
 * <ModifiedBadge
 *  payload='{"name": "Alice", "age": 30}'
 *  skeleton='{"name": "Alice", "age": 25}'
 * />
 * // Renders a badge indicating the payload has been modified compared to the skeleton
 * ```
 * @param payload - The JSON string representing the current payload to compare
 * @param skeleton - The original JSON string to compare against (the "skeleton")
 * @returns A React element displaying the modified badge if the payload differs from the skeleton, or null if they are identical
 */
export function ModifiedBadge({
  payload,
  skeleton,
}: {
  payload: string;
  skeleton: string;
}) {
  const isModified = useMemo<boolean>(() => {
    try {
      return (
        JSON.stringify(JSON.parse(payload)) !==
        JSON.stringify(JSON.parse(skeleton))
      );
    } catch {
      return true;
    }
  }, [payload, skeleton]);
  if (!isModified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-zinc-500 border border-zinc-700/50 rounded-md px-1.5 py-0.5 bg-zinc-800/50">
      <Diff className="w-2 h-2" />
      modified
    </span>
  );
}
