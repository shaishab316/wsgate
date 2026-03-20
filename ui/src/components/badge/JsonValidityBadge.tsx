import { resolveFakerVars } from "@/lib/faker";
import { tryParseJson } from "@/lib/utils";
import { CircleDot } from "lucide-react";
import { useMemo } from "react";

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
