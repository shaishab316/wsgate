import { hasFakerVars } from "@/lib/faker";
import { Sparkles } from "lucide-react";

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
