import { highlightJson, safeStringify } from "@/lib/utils";
import { memo, useMemo } from "react";

/**
 * Read-only JSON viewer using a native `<pre>` tag.
 * Height is content-driven — expands naturally, no math, no clipping.
 * `max-h-[260px] overflow-y-auto` adds a scroll window for huge payloads
 * without capping smaller ones.
 */
export const JsonViewer = memo(function JsonViewer({
  data,
}: {
  data: unknown;
}) {
  const highlighted = useMemo(() => highlightJson(safeStringify(data)), [data]);
  return (
    <pre
      className="text-[11.5px] leading-relaxed font-mono p-3 overflow-x-auto overflow-y-auto max-h-[260px] bg-transparent whitespace-pre-wrap break-words text-zinc-300"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
});
