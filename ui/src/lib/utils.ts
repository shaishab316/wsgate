import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TYPE_ICON } from "@/components/Config";

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
