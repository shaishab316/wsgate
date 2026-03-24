import { memo, useMemo } from "react";
import { highlightJson, safeStringify } from "@/lib/utils";

/**
 * Component that renders JSON data as highlighted, formatted HTML.
 *
 * This component safely converts unknown data to a JSON string, applies syntax highlighting,
 * and displays it in a scrollable pre-formatted container with monospace font.
 *
 * @accessibility
 * - Rendered as `<pre>` element for semantic block code representation
 * - Content is read aloud by screen readers as preformatted text
 * - Syntax highlighting is visual only; structure conveyed through JSON text content
 * - Scrollable container may need keyboard navigation support if focused
 *
 * @component
 * @example
 * ```tsx
 * const data = { name: "John", age: 30 };
 * <JsonViewer data={data} />
 * ```
 *
 * @param {Object} props - Component props
 * @param {unknown} props.data - The data to be displayed as formatted JSON
 *
 * @returns {JSX.Element} A pre element containing highlighted JSON content with scrollable overflow
 *
 * @remarks
 * - Uses `useMemo` to memoize the highlighting operation based on data changes
 * - Uses `dangerouslySetInnerHTML` to render HTML-formatted syntax-highlighted JSON
 * - Supports horizontal and vertical scrolling with max height constraint (65 units)
 * - Text wrapping is enabled with word break handling
 */
export const JsonViewer = memo(function JsonViewer({
  data,
}: {
  data: unknown;
}) {
  const highlighted = useMemo(() => highlightJson(safeStringify(data)), [data]);
  return (
    <pre
      className="text-[11.5px] bg-[#1e1e1e] leading-relaxed font-mono p-3 overflow-x-auto overflow-y-auto max-h-65 whitespace-pre-wrap wrap-break-word"
      // eslint-disable-next-line react/no-danger
      // biome-ignore lint/security/noDangerouslySetInnerHtml: This component is specifically designed to render syntax-highlighted JSON, which requires rendering HTML content. The `highlightJson` function is responsible for sanitizing and safely formatting the JSON string to prevent XSS vulnerabilities. We ensure that only trusted data is passed to this component.
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
});
