import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  NAMESPACE_PALETTE,
  TYPE_ICON,
} from "@/components/sub-components/Config";
import type { WsEvent } from "@/types/ws-event";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a type string into a JSON Schema compatible object.
 *
 * Handles union types (pipe-separated) and common type names,
 * returning schema fragments for validation and code generation.
 *
 * @example
 * ```
 * resolveJsonType("string") → { type: "string" }
 * resolveJsonType("number") → { type: "number" }
 * resolveJsonType("admin|user|guest") → { enum: ["admin", "user", "guest"] }
 * ```
 *
 * @param type - Type string from event payload definition (e.g., "number", "boolean|null", "one|two|three")
 * @returns JSON Schema compatible object for validation or code generation
 */
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

/**
 * Build an empty/default payload object from type definitions.
 *
 * Creates a skeleton payload with sensible defaults based on type hints:
 * - `string` → empty string `""`
 * - `number|integer` → `0`
 * - `boolean` → `false`
 * - union types → first option (e.g., "admin|user" → "admin")
 *
 * Used in EventPanel when user selects an event to initialize the editor.
 *
 * @example
 * ```
 * const def = { userId: "string", count: "number", active: "boolean" }
 * buildPayloadSkeleton(def) // { userId: "", count: 0, active: false }
 * ```
 *
 * @param payload - Payload type definitions from WsEvent (Record<key, typeString>)
 * @returns Object with same keys, default values based on types
 */
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

/**
 * Safely parse JSON string, returning null on error.
 *
 * Used for validating/loading user-entered JSON without throwing.
 * Never throws — returns null if parse fails for any reason.
 *
 * @example
 * ```
 * tryParseJson('{"ok":true}') → { ok: true }
 * tryParseJson('invalid') → null
 * ```
 *
 * @param raw - Raw JSON string to parse
 * @returns Parsed object or null if parsing fails
 */
export function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Generate a namespaced localStorage key for storing event-specific data.
 *
 * Prevents collisions between different events' history, presets, and settings.
 * Key format: `wsgate:<eventName>:<suffix>`
 *
 * @example
 * ```
 * storageKey("user.created", "history") // "wsgate:user.created:history"
 * storageKey("user.created", "presets") // "wsgate:user.created:presets"
 * ```
 *
 * @param eventName - WebSocket event name (e.g., "user.created")
 * @param suffix - Data type suffix (e.g., "history", "presets", "lastPayload")
 * @returns Unique localStorage key for this event/data combination
 */
export function storageKey(eventName: string, suffix: string) {
  return `wsgate:${eventName}:${suffix}`;
}

/**
 * Load and parse a JSON value from localStorage, with fallback.
 *
 * Generic function for type-safe storage access. Returns fallback
 * if key doesn't exist, isn't valid JSON, or any error occurs during parse.
 * Never throws.
 *
 * @example
 * ```tsx
 * const history = loadFromStorage<HistoryEntry[]>(
 *   storageKey(eventName, "history"),
 *   [] // default empty history
 * );
 * ```
 *
 * @typeParam T - Expected type of stored value (used for TypeScript only)
 * @param key - localStorage key
 * @param fallback - Value to return if key missing, invalid, or unparseable
 * @returns Parsed stored value, or fallback value
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Save a value to localStorage as JSON, silently handling quota errors.
 *
 * Wraps the value in JSON.stringify() and stores to localStorage.
 * If quota is exceeded or any error occurs, silently fails (doesn't throw).
 * Used for persisting event history, presets, and UI state.
 *
 * @example
 * ```tsx
 * saveToStorage(storageKey(eventName, "presets"), currentPresets);
 * ```
 *
 * @param key - localStorage key
 * @param value - Any JSON-serializable value
 */
export function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

/**
 * Generate a random short alphanumeric ID suitable for UI identifiers.
 *
 * Uses `Math.random().toString(36)` to create 7-character unique IDs.
 * Good enough for frontend identifiers but NOT cryptographically secure.
 * Used for log entry IDs, temporary component keys, etc.
 *
 * @example
 * ```
 * shortId() // "a5x9k2m"
 * shortId() // "7qp3n1b"
 * ```
 *
 * @returns Random 7-character alphanumeric string
 */
export function shortId() {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Format an ISO timestamp as relative human-readable time (e.g., "5s ago").
 *
 * Supports: just now, seconds, minutes, hours.
 * Used in event logs and timestamps across the UI.
 *
 * @example
 * ```
 * relativeTime("2025-03-20T15:30:00Z") // "2s ago" (if called at 15:30:02Z)
 * relativeTime("2025-03-20T15:20:00Z") // "10m ago"
 * ```
 *
 * @param iso - ISO 8601 timestamp string
 * @returns Relative time string ("just now", "5s ago", "2m ago", "1h ago", etc.)
 */
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
export function getUniqueNamespaces(events: WsEvent[] | null): string[] {
  const set = new Set(events?.map((e) => e.namespace ?? "/") ?? []);
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
  events: WsEvent[] | null,
): Record<string, Record<string, WsEvent[]>> {
  return (
    events?.reduce<Record<string, Record<string, WsEvent[]>>>(
      (parts, event) => {
        const ns = event.namespace ?? "/";
        const gw = event.gatewayName ?? "Default";
        if (!parts[ns]) {
          parts[ns] = {};
        }
        if (!parts[ns][gw]) {
          parts[ns][gw] = [];
        }
        parts[ns][gw].push(event);
        return parts;
      },
      {},
    ) ?? {}
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

/**
 * Format milliseconds as human-readable latency (ms or s).
 *
 * @example
 * ```
 * formatLatency(450) // "450ms"
 * formatLatency(1500) // "1.5s"
 * ```
 *
 * @param ms - Latency in milliseconds
 * @returns Formatted latency string with unit ("Xms" or "Xs")
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Trigger browser download of data as a JSON file.
 *
 * Creates a Blob, generates a download link, and triggers the download
 * in the user's browser. Auto-formats with 2-space indent for readability.
 *
 * @example
 * ```tsx
 * <button onClick={() => downloadJson(logs, "events.json")}>
 *   Export as JSON
 * </button>
 * ```
 *
 * @param data - Any JSON-serializable value to export
 * @param filename - Name for downloaded file (e.g., "events.json")
 */
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

/**
 * Safely stringify any value to JSON with 2-space indent, fallback to String().
 *
 * Used for preparing payloads for display/copying. If JSON.stringify fails
 * (e.g., circular references), falls back to String(data).
 *
 * @example
 * ```
 * safeStringify({ x: 1 }) // '{\n  "x": 1\n}'
 * safeStringify(undefined) // "undefined"
 * ```
 *
 * @param data - Any value to stringify
 * @returns Pretty-printed JSON (2-space indent) or String representation
 */
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
