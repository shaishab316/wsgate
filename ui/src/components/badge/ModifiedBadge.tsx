import { Diff } from "lucide-react";
import { useMemo } from "react";

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
