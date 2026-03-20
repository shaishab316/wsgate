import { getTypeConfig } from "@/lib/utils";

export function SchemaPills({
  payload,
  label,
}: {
  payload: Record<string, string>;
  label: string;
}) {
  const entries = Object.entries(payload ?? {});
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 shrink-0">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, type]) => {
          const conf = getTypeConfig(type);
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1.5 text-[11px] font-mono border rounded-lg px-2 py-1 ${conf.color}`}
            >
              {conf.icon}
              <span className="text-zinc-300">{key}</span>
              <span className="text-zinc-600">:</span>
              <span>{type}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
