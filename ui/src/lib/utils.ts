import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  NAMESPACE_PALETTE,
  TYPE_ICON,
} from "@/components/sub-components/Config";
import type { WsEvent } from "@/types/ws-event";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveJsonType(type: string): object {
  const trimmed = type.trim();
  if (trimmed.includes("|"))
    return { enum: trimmed.split("|").map((t) => t.trim()) };
  switch (trimmed) {
    case "number":
    case "integer":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    default:
      return { type: "string" };
  }
}

export function buildPayloadSkeleton(
  payload: Record<string, string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, type]) => {
      const t = type.trim();
      if (t.includes("|")) return [key, t.split("|")[0].trim()];
      if (t === "number" || t === "integer") return [key, 0];
      if (t === "boolean") return [key, false];
      return [key, ""];
    }),
  );
}

export function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storageKey(eventName: string, suffix: string) {
  return `wsgate:${eventName}:${suffix}`;
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function shortId() {
  return Math.random().toString(36).slice(2, 9);
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function getTypeConfig(type: string) {
  const t = type.trim();
  if (t.includes("|")) return TYPE_ICON.enum;
  return TYPE_ICON[t] ?? TYPE_ICON.default;
}

/**
 * Returns the color tokens for a given namespace string.
 *
 * `'/'` always gets the neutral (zinc) slot.
 * All other namespaces are assigned by their position among non-root
 * namespaces (sorted alphabetically), cycling through the palette.
 *
 * @param ns            - The namespace to look up (e.g. `'/admin'`).
 * @param allNamespaces - Full sorted list of unique namespaces.
 */
export function namespaceColor(ns: string, allNamespaces: string[]) {
  if (ns === "/") return NAMESPACE_PALETTE[0];
  const others = allNamespaces.filter((n) => n !== "/").sort();
  const idx = others.indexOf(ns);
  return NAMESPACE_PALETTE[1 + (idx % (NAMESPACE_PALETTE.length - 1))];
}

/**
 * Gets a friendly display name for a namespace.
 * Strips leading "/" and capitalizes first letter.
 *
 * @param ns - The namespace string (e.g. `'/chat'`).
 * @returns Friendly display name.
 */
export function getNamespaceDisplayName(ns: string): string {
  if (ns === "/") return "Global";
  return ns.slice(1).charAt(0).toUpperCase() + ns.slice(2);
}

/**
 * Extracts unique namespace values from a flat event list and returns
 * them sorted with `'/'` always first.
 *
 * @param events - The full discovered event list.
 * @returns Sorted array of unique namespace strings.
 */
export function getUniqueNamespaces(events: WsEvent[]): string[] {
  const set = new Set(events.map((e) => e.namespace ?? "/"));
  const sorted = [...set].filter((n) => n !== "/").sort();
  return set.has("/") ? ["/", ...sorted] : sorted;
}

/**
 * Groups a flat event list by namespace, then by gateway within each namespace.
 * Falls back to `"/"` for namespace and `"Default"` for gateway.
 *
 * @param events - Flat list of discovered WsEvents.
 * @returns Record mapping namespace → (gateway name → events).
 */
export function groupByNamespaceThenGateway(
  events: WsEvent[],
): Record<string, Record<string, WsEvent[]>> {
  return events.reduce<Record<string, Record<string, WsEvent[]>>>(
    (parts, event) => {
      const ns = event.namespace ?? "/";
      const gw = event.gatewayName ?? "Default";
      (parts[ns] ??= {})[gw] ??= [];
      parts[ns][gw].push(event);
      return parts;
    },
    {},
  );
}

/**
 * Filters events by a search query across event name and description.
 *
 * @param events - Full event list.
 * @param query  - Search string (case-insensitive).
 * @returns Filtered event list.
 */
export function filterEvents(events: WsEvent[], query: string): WsEvent[] {
  if (!query.trim()) return events;
  const lower = query.toLowerCase();
  return events.filter(
    (e) =>
      e.event.toLowerCase().includes(lower) ||
      e.description?.toLowerCase().includes(lower),
  );
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Lightweight JSON syntax highlighter.
 *
 * WHY this replaces Monaco in log cards:
 * Monaco requires an explicit pixel height. With `wordWrap: on`, the rendered
 * height depends on the container width — so any `lines * 18` formula is
 * wrong whenever the container resizes or content wraps. This causes the
 * card-height clipping visible in the screenshot.
 *
 * A `<pre>` tag is height-agnostic — it expands exactly to its content.
 * No calculation, no cap, no clipping. Also ~100× lighter for 200 entries.
 */
export function highlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let style = "color:#ce9178"; // string value — orange
        if (/^"/.test(match)) {
          if (/:$/.test(match)) style = "color:#9cdcfe"; // key — blue
          // else string value stays orange
        } else if (/true|false/.test(match)) {
          style = "color:#569cd6"; // boolean — blue
        } else if (/null/.test(match)) {
          style = "color:#808080"; // null — grey
        } else {
          style = "color:#b5cea8"; // number — green
        }
        return `<span style="${style}">${match}</span>`;
      },
    );
}
