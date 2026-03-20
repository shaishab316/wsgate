import { getTypeConfig } from "@/lib/utils";

/**
 * Renders a collection of schema property pills displaying type information.
 *
 * @component
 * @param {Object} props - The component props
 * @param {Record<string, string>} props.payload - A key-value object where keys are property names and values are their types
 * @param {string} props.label - The label text to display above the pills
 * @returns {JSX.Element | null} A flex container with styled pills for each property, or null if payload is empty
 *
 * @example
 * const schema = { name: 'string', age: 'number', active: 'boolean' };
 * <SchemaPills payload={schema} label="Request Body" />
 */
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
