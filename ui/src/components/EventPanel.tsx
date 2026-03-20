/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Send,
  Radio,
  Zap,
  Copy,
  Check,
  RotateCcw,
  ChevronRight,
  Braces,
  Hash,
  ToggleLeft,
  Type,
  List,
  ArrowDownLeft,
  MousePointerClick,
  WifiOff,
  AlertCircle,
  X,
  Code2,
  History,
  BookmarkPlus,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Repeat2,
  CircleDot,
  Diff,
  Loader2,
  Clock,
  Trash2,
  Tag,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Editor, { useMonaco, type OnMount } from "@monaco-editor/react";
import type * as MonacoType from "monaco-editor";
import { useWsgateStore, type SelectedEvent } from "@/store/wsgate.store";
import { useSocketStore } from "@/hooks/useSocket";
import CodeGenPanel from "@/components/CodeGenPanel";
import ShortcutHint from "@/components/ShortcutHint";
import EmptyState from "./EmptyState";

// ── Types ──────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  payload: string;
  sentAt: string;
  event: string;
}

interface Preset {
  id: string;
  name: string;
  payload: string;
  createdAt: string;
}

interface MultiEmitResult {
  index: number;
  ack: unknown;
  sentAt: string;
  ok: boolean;
}

// ── Faker Variables ───────────────────────────────────

/**
 * Faker variable definitions.
 * Each entry has: a resolver fn, the resolved type, and a human description.
 * Syntax: {{$variableName}} inside any JSON string value.
 *
 * Type-aware resolution — number/boolean vars resolve to unquoted JSON literals.
 * e.g.  "age": "{{$randomInt}}"  →  "age": 42
 *       "name": "{{$firstName}}"  →  "name": "Alice"
 */
interface FakerVarDef {
  resolve: () => unknown;
  type: "string" | "number" | "boolean" | "uuid";
  description: string;
  example: string;
}

// ── Static word banks (no external dep) ──────────────

const _FIRST = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eva",
  "Frank",
  "Grace",
  "Henry",
  "Iris",
  "Jack",
  "Kate",
  "Liam",
  "Mia",
  "Noah",
  "Olivia",
  "Paul",
  "Quinn",
  "Rosa",
  "Sam",
  "Tina",
];
const _LAST = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
];
const _WORDS = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "echo",
  "foxtrot",
  "hotel",
  "india",
  "juliet",
  "kilo",
  "lima",
  "mike",
  "november",
  "oscar",
  "papa",
  "quebec",
  "romeo",
  "sierra",
  "tango",
  "uniform",
];
const _DOMAINS = [
  "example.com",
  "mail.io",
  "test.dev",
  "inbox.net",
  "demo.org",
];
const _TLDS = ["com", "io", "dev", "net", "org", "co"];
const _LOCALES = [
  "en-US",
  "en-GB",
  "fr-FR",
  "de-DE",
  "ja-JP",
  "pt-BR",
  "es-ES",
  "zh-CN",
];
const _COLORS = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "teal",
  "pink",
  "indigo",
  "cyan",
];
const _STATUS = ["active", "inactive", "pending", "suspended", "verified"];
const _ROLES = ["admin", "user", "moderator", "editor", "viewer", "superadmin"];

function _pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function _int(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function _uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const FAKER_VARS: Record<string, FakerVarDef> = {
  $randomFirstName: {
    resolve: () => _pick(_FIRST),
    type: "string",
    description: "Random first name",
    example: "Alice",
  },
  $randomLastName: {
    resolve: () => _pick(_LAST),
    type: "string",
    description: "Random last name",
    example: "Smith",
  },
  $randomFullName: {
    resolve: () => `${_pick(_FIRST)} ${_pick(_LAST)}`,
    type: "string",
    description: "Full name",
    example: "Alice Smith",
  },
  $randomEmail: {
    resolve: () =>
      `${_pick(_FIRST).toLowerCase()}.${_pick(_LAST).toLowerCase()}${_int(1, 99)}@${_pick(_DOMAINS)}`,
    type: "string",
    description: "Random email address",
    example: "alice.smith42@example.com",
  },
  $randomUsername: {
    resolve: () => `${_pick(_FIRST).toLowerCase()}${_int(10, 999)}`,
    type: "string",
    description: "Random username",
    example: "alice247",
  },
  $randomPassword: {
    resolve: () =>
      Array.from(
        { length: 12 },
        () =>
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"[
            _int(0, 66)
          ],
      ).join(""),
    type: "string",
    description: "Random 12-char password",
    example: "aB3!xYqZ9kP2",
  },
  $randomUUID: {
    resolve: _uuid,
    type: "uuid",
    description: "Random UUID v4",
    example: "110e8400-e29b-41d4-a716-446655440000",
  },
  $randomInt: {
    resolve: () => _int(1, 9999),
    type: "number",
    description: "Random integer 1–9999",
    example: "4271",
  },
  $randomFloat: {
    resolve: () => parseFloat((Math.random() * 1000).toFixed(2)),
    type: "number",
    description: "Random float",
    example: "347.85",
  },
  $randomBoolean: {
    resolve: () => Math.random() > 0.5,
    type: "boolean",
    description: "Random true/false",
    example: "true",
  },
  $timestamp: {
    resolve: () => Date.now(),
    type: "number",
    description: "Current Unix ms timestamp",
    example: "1711012345678",
  },
  $isoTimestamp: {
    resolve: () => new Date().toISOString(),
    type: "string",
    description: "Current ISO 8601 date-time",
    example: "2026-03-20T14:30:00.000Z",
  },
  $randomWord: {
    resolve: () => _pick(_WORDS),
    type: "string",
    description: "Random NATO phonetic word",
    example: "alpha",
  },
  $randomSlug: {
    resolve: () => `${_pick(_WORDS)}-${_pick(_WORDS)}-${_int(10, 99)}`,
    type: "string",
    description: "URL-friendly slug",
    example: "alpha-bravo-42",
  },
  $randomDomain: {
    resolve: () => `${_pick(_WORDS)}.${_pick(_TLDS)}`,
    type: "string",
    description: "Random domain",
    example: "echo.dev",
  },
  $randomUrl: {
    resolve: () => `https://${_pick(_WORDS)}.${_pick(_TLDS)}/${_pick(_WORDS)}`,
    type: "string",
    description: "Random URL",
    example: "https://alpha.io/beta",
  },
  $randomColor: {
    resolve: () => _pick(_COLORS),
    type: "string",
    description: "Random color name",
    example: "teal",
  },
  $randomHexColor: {
    resolve: () => `#${_int(0, 0xffffff).toString(16).padStart(6, "0")}`,
    type: "string",
    description: "Random hex color",
    example: "#a3f2c1",
  },
  $randomStatus: {
    resolve: () => _pick(_STATUS),
    type: "string",
    description: "Random status value",
    example: "active",
  },
  $randomRole: {
    resolve: () => _pick(_ROLES),
    type: "string",
    description: "Random role",
    example: "editor",
  },
  $randomLocale: {
    resolve: () => _pick(_LOCALES),
    type: "string",
    description: "Random locale code",
    example: "en-US",
  },
  $randomIP: {
    resolve: () =>
      `${_int(1, 254)}.${_int(0, 254)}.${_int(0, 254)}.${_int(1, 254)}`,
    type: "string",
    description: "Random IPv4 address",
    example: "192.168.4.21",
  },
  $randomPort: {
    resolve: () => _int(1024, 65535),
    type: "number",
    description: "Random port number",
    example: "8432",
  },
  $randomVersion: {
    resolve: () => `${_int(0, 5)}.${_int(0, 20)}.${_int(0, 100)}`,
    type: "string",
    description: "Random semver string",
    example: "2.7.14",
  },
};

/**
 * Resolves all `{{$varName}}` placeholders in a raw JSON string.
 *
 * TYPE-AWARE: When the entire JSON value is a faker placeholder
 * (i.e. `"{{$randomInt}}"`) the surrounding quotes are removed
 * so numbers and booleans land as their correct JSON types.
 *
 * Mixed strings like `"user-{{$randomInt}}"` always resolve as strings.
 */
export function resolveFakerVars(jsonStr: string): string {
  // Pass 1 — pure-value replacements (the whole string value IS one var)
  // "{{$randomInt}}" → 42  (unquoted — correct JSON type)
  let result = jsonStr.replace(
    /"(\{\{(\$[^}]+)\}\})"/g,
    (match, _full, varName) => {
      const def = FAKER_VARS[varName];
      if (!def) return match;
      const value = def.resolve();
      if (typeof value === "string") return JSON.stringify(value);
      // number / boolean → unquoted literal
      return JSON.stringify(value);
    },
  );

  // Pass 2 — interpolated replacements inside a larger string
  // "Hello {{$randomFirstName}}, your ID is {{$randomInt}}"
  // → always a string, vars become their string representation
  result = result.replace(/\{\{(\$[^}]+)\}\}/g, (match, varName) => {
    const def = FAKER_VARS[varName];
    if (!def) return match;
    return String(def.resolve());
  });

  return result;
}

/** Returns true if a string contains any faker placeholder. */
function hasFakerVars(jsonStr: string): boolean {
  return /\{\{\$[^}]+\}\}/.test(jsonStr);
}

// ── Faker completion items for Monaco ─────────────────

/**
 * Builds Monaco CompletionItem list from FAKER_VARS.
 * Registered as a JSON language provider — triggered on `{` and Ctrl+Space.
 */
function buildFakerCompletions(
  monaco: typeof MonacoType,
  range: MonacoType.IRange,
): MonacoType.languages.CompletionItem[] {
  return Object.entries(FAKER_VARS).map(([name, def]) => ({
    label: `{{${name}}}`,
    kind: monaco.languages.CompletionItemKind.Variable,
    detail: `faker · ${def.type}`,
    documentation: {
      value: `**${def.description}**\n\nExample: \`${def.example}\`\n\nType: \`${def.type}\``,
    },
    insertText: `{{${name}}}`,
    filterText: name,
    sortText: name,
    range,
  }));
}

// ── Helpers ───────────────────────────────────────────

function resolveJsonType(type: string): object {
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

function buildPayloadSkeleton(
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

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storageKey(eventName: string, suffix: string) {
  return `wsgate:${eventName}:${suffix}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function shortId() {
  return Math.random().toString(36).slice(2, 9);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

const HISTORY_LIMIT = 8;

// ── Editor constants ──────────────────────────────────

const BASE_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: "JetBrains Mono, Fira Code, monospace",
  lineNumbers: "off" as const,
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  folding: false,
  renderLineHighlight: "none" as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "hidden" as const,
    verticalScrollbarSize: 6,
  },
  padding: { top: 12, bottom: 12 },
};

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  string: {
    icon: <Type className="w-2.5 h-2.5" />,
    color: "text-amber-400  border-amber-500/30  bg-amber-500/5",
  },
  number: {
    icon: <Hash className="w-2.5 h-2.5" />,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  },
  integer: {
    icon: <Hash className="w-2.5 h-2.5" />,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  },
  boolean: {
    icon: <ToggleLeft className="w-2.5 h-2.5" />,
    color: "text-pink-400   border-pink-500/30   bg-pink-500/5",
  },
  enum: {
    icon: <List className="w-2.5 h-2.5" />,
    color: "text-cyan-400   border-cyan-500/30   bg-cyan-500/5",
  },
  default: {
    icon: <Braces className="w-2.5 h-2.5" />,
    color: "text-zinc-400  border-zinc-600      bg-zinc-800",
  },
};

function getTypeConfig(type: string) {
  const t = type.trim();
  if (t.includes("|")) return TYPE_ICON.enum;
  return TYPE_ICON[t] ?? TYPE_ICON.default;
}

// ── Sub-components ────────────────────────────────────

function EditorShimmer() {
  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-zinc-800 animate-pulse"
          style={{ width: `${30 + (i % 4) * 15}%` }}
        />
      ))}
    </div>
  );
}

function PanelShimmer() {
  return (
    <div className="flex flex-col h-full p-5 gap-5 overflow-hidden">
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-36 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="h-3 w-52 rounded bg-zinc-800/70 animate-pulse" />
      </div>
      <div className="flex gap-2 shrink-0">
        {[70, 90, 60].map((w, i) => (
          <div
            key={i}
            className="h-6 rounded-lg bg-zinc-800 animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-zinc-800 animate-pulse"
              style={{ width: `${30 + (i % 4) * 15}%` }}
            />
          ))}
        </div>
      </div>
      <div className="h-11 w-full rounded-xl bg-zinc-800 animate-pulse shrink-0" />
    </div>
  );
}

function EmitError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 shrink-0">
      <div className="shrink-0 w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center">
        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
      </div>
      <p className="text-xs text-red-300 flex-1 font-mono">{message}</p>
      <button
        onClick={onDismiss}
        className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function EventHeader({ event }: { event: SelectedEvent }) {
  const isEmit = event.type === "emit";
  const nsDisplay =
    event.namespace === "/"
      ? "Global"
      : (event.namespace?.slice(1).toUpperCase() ?? "GLOBAL");
  return (
    <div className="flex flex-col gap-3 pb-4 border-b border-zinc-800/80 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-[9px] font-mono font-semibold text-blue-300 uppercase tracking-widest">
          {nsDisplay} Namespace
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${isEmit ? "bg-blue-500/15 border border-blue-500/30" : "bg-emerald-500/15 border border-emerald-500/30"}`}
          >
            {isEmit ? (
              <Send className="w-4 h-4 text-blue-400" />
            ) : (
              <Radio className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold font-mono text-zinc-100 truncate">
              {event.event}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
              {event.description}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-xs gap-1 ${isEmit ? "border-blue-500/40 text-blue-400 bg-blue-500/5" : "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"}`}
        >
          {isEmit ? (
            <Send className="w-2.5 h-2.5" />
          ) : (
            <Radio className="w-2.5 h-2.5" />
          )}
          {event.type}
        </Badge>
      </div>
      <div className="flex items-center gap-2 flex-wrap pl-11">
        <Badge
          variant="outline"
          className="text-[10px] border-blue-500/40 text-blue-300 bg-blue-500/10 gap-1.5 font-mono font-semibold"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {event.namespace ?? "/"}
        </Badge>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
        <Badge
          variant="outline"
          className="text-[10px] border-zinc-700 text-zinc-500 gap-1"
        >
          <Zap className="w-2.5 h-2.5 text-blue-400" />
          {event.gatewayName}
        </Badge>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
        <Badge
          variant="outline"
          className="text-[10px] border-zinc-700 text-zinc-500 gap-1 font-mono"
        >
          {event.handlerName}()
        </Badge>
      </div>
    </div>
  );
}

function SchemaPills({
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Copy
        </>
      )}
    </button>
  );
}

function JsonValidityBadge({ payload }: { payload: string }) {
  const isValid = useMemo(
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

function ModifiedBadge({
  payload,
  skeleton,
}: {
  payload: string;
  skeleton: string;
}) {
  const isModified = useMemo(() => {
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

// ── NEW: Faker vars indicator badge ───────────────────

function FakerBadge({ payload }: { payload: string }) {
  if (!hasFakerVars(payload)) return null;
  const count = (payload.match(/\{\{\$[^}]+\}\}/g) ?? []).length;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold rounded-md px-1.5 py-0.5 border text-violet-400 border-violet-500/30 bg-violet-500/8 animate-pulse">
      <Sparkles className="w-2 h-2" />
      {count} faker var{count !== 1 ? "s" : ""}
    </span>
  );
}

// ── NEW: Faker Variables Reference Panel ──────────────

/**
 * Slide-in reference panel listing all available {{$var}} tokens.
 * Clicking a variable inserts it into the editor at cursor, or
 * copies it to clipboard if no editor ref is available.
 */
function FakerVarsPanel({
  onInsert,
  onClose,
}: {
  onInsert: (snippet: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const typeGroups = useMemo(() => {
    const filtered = Object.entries(FAKER_VARS).filter(([name, def]) => {
      if (!search) return true;
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        def.description.toLowerCase().includes(search.toLowerCase())
      );
    });
    const groups: Record<string, [string, FakerVarDef][]> = {};
    for (const [name, def] of filtered) {
      const g = def.type;
      if (!groups[g]) groups[g] = [];
      groups[g].push([name, def]);
    }
    return groups;
  }, [search]);

  const typeColor: Record<string, string> = {
    string: "text-amber-400  border-amber-500/25  bg-amber-500/8",
    number: "text-purple-400 border-purple-500/25 bg-purple-500/8",
    boolean: "text-pink-400   border-pink-500/25   bg-pink-500/8",
    uuid: "text-cyan-400   border-cyan-500/25   bg-cyan-500/8",
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-80 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/70 overflow-hidden flex flex-col"
      style={{ maxHeight: "420px" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/80 shrink-0">
        <Sparkles className="w-3 h-3 text-violet-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 flex-1">
          Faker Variables
        </span>
        <span className="text-[9px] text-zinc-600 font-mono">
          Ctrl+Space in editor
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-zinc-800/50 shrink-0">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search variables…"
          className="w-full text-[11px] bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 placeholder:text-zinc-700 font-mono outline-none focus:border-zinc-600 transition-colors"
          autoFocus
        />
      </div>

      {/* Variable list */}
      <div className="overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:rgba(113,119,144,0.4)_transparent]">
        {Object.entries(typeGroups).map(([type, vars]) => (
          <div key={type}>
            <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/30">
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeColor[type] ?? "text-zinc-500 border-zinc-700"}`}
              >
                {type}
              </span>
            </div>
            {vars.map(([name, def]) => (
              <button
                key={name}
                onClick={() => {
                  onInsert(`{{${name}}}`);
                  onClose();
                }}
                className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-zinc-800/60 transition-colors text-left group border-b border-zinc-800/20 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-violet-300 group-hover:text-violet-200">
                      {`{{${name}}}`}
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-0.5 truncate">
                    {def.description}
                  </p>
                  <p className="text-[9px] text-zinc-700 font-mono truncate">
                    eg. {def.example}
                  </p>
                </div>
                <span className="text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                  Insert →
                </span>
              </button>
            ))}
          </div>
        ))}
        {Object.keys(typeGroups).length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-[11px] text-zinc-600">No variables match</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-zinc-800/50 shrink-0 flex items-center gap-2">
        <FlaskConical className="w-3 h-3 text-zinc-700" />
        <span className="text-[9px] text-zinc-700">
          Variables resolve at emit time — re-rolled every send
        </span>
      </div>
    </div>
  );
}

// ── History & Presets dropdowns (unchanged API, kept) ─

function HistoryDropdown({
  history,
  onRestore,
  onClear,
  onClose,
}: {
  history: HistoryEntry[];
  onRestore: (payload: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-72 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Payload History
        </span>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            Clear
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="px-3 py-5 text-center">
          <p className="text-[11px] text-zinc-600">No history yet</p>
          <p className="text-[10px] text-zinc-700 mt-0.5">
            Sent payloads appear here
          </p>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                onRestore(entry.payload);
                onClose();
              }}
              className="w-full flex flex-col gap-1 px-3 py-2.5 hover:bg-zinc-800/60 transition-colors text-left border-b border-zinc-800/40 last:border-0 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {relativeTime(entry.sentAt)}
                </span>
                <span className="text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Restore →
                </span>
              </div>
              <pre className="text-[10px] font-mono text-zinc-400 truncate max-w-full overflow-hidden">
                {entry.payload.replace(/\s+/g, " ").slice(0, 80)}
              </pre>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PresetsDropdown({
  presets,
  onLoad,
  onSave,
  onDelete,
  onClose,
}: {
  presets: Preset[];
  currentPayload: string;
  onLoad: (payload: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  function handleSave() {
    const name = newName.trim();
    if (!name) return;
    onSave(name);
    setNewName("");
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-72 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-zinc-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Saved Presets
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/60">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Preset name…"
          className="flex-1 text-[11px] bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-200 placeholder:text-zinc-700 font-mono outline-none focus:border-zinc-600 transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={!newName.trim()}
          className="shrink-0 text-[10px] text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 hover:border-zinc-500 rounded-lg px-2.5 py-1.5 transition-all bg-zinc-900 hover:bg-zinc-800"
        >
          Save
        </button>
      </div>
      {presets.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <p className="text-[11px] text-zinc-600">No presets saved yet</p>
        </div>
      ) : (
        <div className="max-h-52 overflow-y-auto">
          {presets.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30 last:border-0 group"
            >
              <Tag className="w-3 h-3 text-zinc-600 shrink-0" />
              <span className="flex-1 text-[11px] font-mono text-zinc-300 truncate">
                {p.name}
              </span>
              <button
                onClick={() => {
                  onLoad(p.payload);
                  onClose();
                }}
                className="text-[9px] text-blue-500 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                Load
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AckPanel({ ack, emitCount }: { ack: unknown; emitCount: number }) {
  const [expanded, setExpanded] = useState(true);
  const formatted = useMemo(() => {
    if (ack === undefined || ack === null) return null;
    try {
      return JSON.stringify(ack, null, 2);
    } catch {
      return String(ack);
    }
  }, [ack]);
  if (formatted === null) return null;
  return (
    <div className="flex flex-col gap-0 rounded-xl border border-emerald-500/20 bg-emerald-500/3 overflow-hidden shrink-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between px-3 py-2 hover:bg-emerald-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">
            ACK Response
          </span>
          <span className="text-[9px] text-zinc-600 font-mono">
            #{emitCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={formatted} />
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-zinc-600" />
          ) : (
            <ChevronDown className="w-3 h-3 text-zinc-600" />
          )}
        </div>
      </button>
      {expanded && (
        <pre className="text-[11px] font-mono text-emerald-300/80 px-3 py-2.5 overflow-x-auto border-t border-emerald-500/10 bg-zinc-950/40 max-h-36">
          {formatted}
        </pre>
      )}
    </div>
  );
}

function MultiEmitPanel({
  onMultiEmit,
  disabled,
}: {
  onMultiEmit: (count: number, delayMs: number) => Promise<MultiEmitResult[]>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [delay, setDelay] = useState(200);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MultiEmitResult[]>([]);
  const cancelRef = useRef(false);

  async function run() {
    setRunning(true);
    setResults([]);
    cancelRef.current = false;
    const res = await onMultiEmit(count, delay);
    if (!cancelRef.current) setResults(res);
    setRunning(false);
  }

  const successCount = results.filter((r) => r.ok).length;
  return (
    <div className="shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-[10px] transition-all px-2 py-1 rounded-md border ${open ? "text-violet-400 border-violet-500/30 bg-violet-500/5" : "text-zinc-600 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50"}`}
      >
        <Repeat2 className="w-3 h-3" />
        Multi
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/3 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-zinc-600">Count</label>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-14 text-[11px] font-mono text-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-zinc-600">Delay (ms)</label>
              <input
                type="number"
                min={0}
                max={5000}
                step={50}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-16 text-[11px] font-mono text-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>
            <div className="flex-1" />
            {running ? (
              <button
                onClick={() => {
                  cancelRef.current = true;
                  setRunning(false);
                }}
                className="flex items-center gap-1.5 text-[10px] text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            ) : (
              <button
                onClick={run}
                disabled={disabled}
                className="flex items-center gap-1.5 text-[10px] text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 transition-colors"
              >
                <Repeat2 className="w-3 h-3" />
                Run ×{count}
              </button>
            )}
          </div>
          {running && (
            <div className="flex items-center gap-2 px-3 pb-2.5">
              <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
              <span className="text-[10px] text-zinc-500">
                Sending {count} emits…
              </span>
            </div>
          )}
          {results.length > 0 && !running && (
            <div className="border-t border-violet-500/10 px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">
                  Results:{" "}
                  <span className="text-emerald-400">{successCount} ok</span>
                  {successCount < results.length && (
                    <span className="text-red-400 ml-1">
                      {results.length - successCount} failed
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setResults([])}
                  className="text-[9px] text-zinc-700 hover:text-zinc-400"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {results.map((r) => (
                  <span
                    key={r.index}
                    title={`#${r.index + 1}`}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${r.ok ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8" : "text-red-400 border-red-500/25 bg-red-500/8"}`}
                  >
                    {r.index + 1}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────

export default function EventPanel() {
  const {
    selectedEvent,
    addLog,
    addAck,
    url,
    token,
    selectedNamespace,
    setSelectedEvent,
  } = useWsgateStore();
  const { emit, status, disconnect } = useSocketStore();
  const connected = status === "connected";

  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [emitSuccess, setEmitSuccess] = useState(false);
  const [codeGenOpen, setCodeGenOpen] = useState(false);
  const [emitCount, setEmitCount] = useState(0);
  const [lastAck, setLastAck] = useState<unknown>(undefined);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [fakerOpen, setFakerOpen] = useState(false);

  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const monaco = useMonaco();

  const skeletonJson = useMemo(() => {
    if (!selectedEvent) return "{}";
    return JSON.stringify(
      buildPayloadSkeleton(selectedEvent.payload ?? {}),
      null,
      2,
    );
  }, [selectedEvent]);

  // ── Load history + presets ────────────────────────────
  useEffect(() => {
    if (!selectedEvent) return;
    setHistory(
      loadFromStorage<HistoryEntry[]>(
        storageKey(selectedEvent.event, "history"),
        [],
      ),
    );
    setPresets(
      loadFromStorage<Preset[]>(storageKey(selectedEvent.event, "presets"), []),
    );
    setLastAck(undefined);
    setEmitCount(0);
  }, [selectedEvent]);

  // ── Editor mount ──────────────────────────────────────
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    setTimeout(
      () => editor.getAction("editor.action.formatDocument")?.run(),
      100,
    );
  };

  // ── Reset on event change ─────────────────────────────
  useEffect(() => {
    setEditorReady(false);
    const t = setTimeout(() => setEditorReady(true), 300);
    return () => clearTimeout(t);
  }, [selectedEvent]);

  // ── Auto-disconnect ───────────────────────────────────
  useEffect(() => {
    if (!selectedEvent) return;
    if ((selectedEvent.namespace ?? "/") !== selectedNamespace && connected)
      disconnect();
  }, [selectedEvent, selectedNamespace, status, disconnect]);

  // ── Skeleton fill ─────────────────────────────────────
  useEffect(() => {
    if (!selectedEvent) return;
    setPayload(skeletonJson);
    setError(null);
    setEmitSuccess(false);
    setTimeout(
      () => editorRef.current?.getAction("editor.action.formatDocument")?.run(),
      150,
    );
  }, [selectedEvent, skeletonJson]);

  // ── Monaco JSON schema ────────────────────────────────
  useEffect(() => {
    if (!monaco || !selectedEvent || selectedEvent.type !== "emit") return;
    const properties = Object.fromEntries(
      Object.entries(selectedEvent.payload ?? {}).map(([key, type]) => [
        key,
        resolveJsonType(type),
      ]),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (monaco.languages as any).json;
    if (!json?.jsonDefaults) return;
    json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: `ws://wsgate/event/${selectedEvent.event}`,
          fileMatch: ["*"],
          schema: {
            type: "object",
            properties,
            required: Object.keys(selectedEvent.payload ?? {}),
            additionalProperties: false,
          },
        },
      ],
    });
  }, [monaco, selectedEvent]);

  // ── NEW: Monaco Faker completion provider ─────────────
  /**
   * Registers a JSON completion provider that offers all {{$var}} tokens
   * when the user presses Ctrl+Space (or types `{{`).
   *
   * The provider is registered once per monaco instance and disposed on cleanup.
   */
  useEffect(() => {
    if (!monaco) return;

    const disposable = monaco.languages.registerCompletionItemProvider("json", {
      // Trigger on `{` so typing `{{` auto-opens completions
      triggerCharacters: ["{", "$"],

      provideCompletionItems(model, position) {
        const wordInfo = model.getWordUntilPosition(position);
        const lineContent = model.getLineContent(position.lineNumber);

        // Only suggest inside a string value (heuristic: line contains a `:`)
        const range: MonacoType.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn,
          endColumn: wordInfo.endColumn,
        };

        // Check if we're inside a string in the JSON
        const beforeCursor = lineContent.slice(0, position.column - 1);
        const isInString = (beforeCursor.match(/"/g)?.length ?? 0) % 2 !== 0;
        if (!isInString) return { suggestions: [] };

        return { suggestions: buildFakerCompletions(monaco, range) };
      },
    });

    return () => disposable.dispose();
  }, [monaco]);

  // ── Handlers ──────────────────────────────────────────

  function handleEmit() {
    if (!selectedEvent || !connected) return;

    // Resolve faker vars before parsing
    const resolved = resolveFakerVars(payload);
    const parsed = tryParseJson(resolved);
    if (parsed === null) {
      setError("Invalid JSON — check your payload syntax");
      return;
    }
    setError(null);
    const logId = addLog("out", selectedEvent.event, parsed);
    emit(selectedEvent.event, parsed, (ackData: unknown) => {
      addAck(logId, ackData);
      setLastAck(ackData);
    });

    const entry: HistoryEntry = {
      id: shortId(),
      payload,
      sentAt: new Date().toISOString(),
      event: selectedEvent.event,
    };
    const next = [entry, ...history].slice(0, HISTORY_LIMIT);
    setHistory(next);
    saveToStorage(storageKey(selectedEvent.event, "history"), next);

    setEmitCount((c) => c + 1);
    setEmitSuccess(true);
    setTimeout(() => setEmitSuccess(false), 1500);
  }

  function handleFormat() {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }

  function handleReset() {
    if (!selectedEvent) return;
    setPayload(skeletonJson);
    setError(null);
    setTimeout(
      () => editorRef.current?.getAction("editor.action.formatDocument")?.run(),
      100,
    );
  }

  function handleRestorePayload(p: string) {
    setPayload(p);
    setError(null);
    setTimeout(
      () => editorRef.current?.getAction("editor.action.formatDocument")?.run(),
      100,
    );
  }

  /**
   * Inserts a faker snippet at the Monaco cursor position.
   * Falls back to appending at end of current value if editor isn't focused.
   */
  function handleInsertFakerVar(snippet: string) {
    const editor = editorRef.current;
    if (!editor) {
      // fallback — just set payload with appended snippet
      setPayload((p) => p.replace(/""\s*$/, `"${snippet}"`));
      return;
    }
    const selection = editor.getSelection();
    if (!selection) return;
    editor.executeEdits("faker-insert", [
      {
        range: selection,
        text: snippet,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }

  function handleSavePreset(name: string) {
    if (!selectedEvent) return;
    const preset: Preset = {
      id: shortId(),
      name,
      payload,
      createdAt: new Date().toISOString(),
    };
    const next = [preset, ...presets];
    setPresets(next);
    saveToStorage(storageKey(selectedEvent.event, "presets"), next);
  }

  function handleDeletePreset(id: string) {
    if (!selectedEvent) return;
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    saveToStorage(storageKey(selectedEvent.event, "presets"), next);
  }

  function handleClearHistory() {
    if (!selectedEvent) return;
    setHistory([]);
    saveToStorage(storageKey(selectedEvent.event, "history"), []);
  }

  const handleMultiEmit = useCallback(
    async (count: number, delayMs: number): Promise<MultiEmitResult[]> => {
      if (!selectedEvent || !connected) return [];
      const resolved = resolveFakerVars(payload);
      const parsed = tryParseJson(resolved);
      if (!parsed) return [];
      const results: MultiEmitResult[] = [];
      for (let i = 0; i < count; i++) {
        await new Promise<void>((resolve) => {
          const logId = addLog("out", selectedEvent.event, parsed);
          emit(selectedEvent.event, parsed, (ackData: unknown) => {
            addAck(logId, ackData);
            results.push({
              index: i,
              ack: ackData,
              sentAt: new Date().toISOString(),
              ok: true,
            });
            resolve();
          });
          setTimeout(() => {
            if (results.length <= i) {
              results.push({
                index: i,
                ack: null,
                sentAt: new Date().toISOString(),
                ok: false,
              });
              resolve();
            }
          }, 3000);
        });
        if (i < count - 1 && delayMs > 0)
          await new Promise((r) => setTimeout(r, delayMs));
      }
      setEmitCount((c) => c + count);
      return results;
    },
    [selectedEvent, connected, payload, emit, addLog, addAck],
  );

  // ── Keyboard shortcut ─────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (connected && selectedEvent?.type === "emit") handleEmit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [connected, selectedEvent, payload]);

  // ── Empty state ───────────────────────────────────────
  if (!selectedEvent) return <EmptyState />;
  if (!editorReady) return <PanelShimmer />;

  // ── Subscribe view ────────────────────────────────────
  if (selectedEvent.type === "subscribe") {
    return (
      <div className="flex flex-col h-full overflow-hidden p-5 gap-4 relative">
        <button
          onClick={() => setSelectedEvent(null)}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <EventHeader event={selectedEvent} />
        <SchemaPills
          payload={selectedEvent.payload ?? {}}
          label="Response Shape"
        />
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Example Response
          </span>
          <CopyButton
            text={JSON.stringify(
              buildPayloadSkeleton(selectedEvent.payload ?? {}),
              null,
              2,
            )}
          />
        </div>
        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 rounded-xl overflow-hidden border border-zinc-800 bg-[#1e1e1e]">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={JSON.stringify(
                buildPayloadSkeleton(selectedEvent.payload ?? {}),
                null,
                2,
              )}
              theme="vs-dark"
              options={{
                ...BASE_EDITOR_OPTIONS,
                readOnly: true,
                contextmenu: false,
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Server-emitted event. Watch the{" "}
            <span className="text-zinc-200 font-medium">Event Log →</span> for
            incoming payloads.
          </p>
        </div>
      </div>
    );
  }

  // ── Emit view ─────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full overflow-hidden p-5 gap-4 relative">
        <button
          onClick={() => setSelectedEvent(null)}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <EventHeader event={selectedEvent} />
        <SchemaPills
          payload={selectedEvent.payload ?? {}}
          label="Payload Schema"
        />

        {selectedEvent.response && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Response event
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg px-2 py-1">
              <Radio className="w-2.5 h-2.5" />
              {selectedEvent.response}
            </span>
          </div>
        )}

        {/* ── Editor section ── */}
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between shrink-0">
            {/* Left — label + live status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Payload (JSON)
              </span>
              <JsonValidityBadge payload={payload} />
              <ModifiedBadge payload={payload} skeleton={skeletonJson} />
              {/* Faker vars indicator — glows when payload contains {{$...}} */}
              <FakerBadge payload={payload} />
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-1 flex-wrap justify-end">
              <CopyButton text={payload} />

              <button
                onClick={handleFormat}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                title="Format JSON (Alt+Shift+F)"
              >
                <Braces className="w-3 h-3" />
                Format
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                title="Reset to skeleton"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>

              <div className="w-px h-4 bg-zinc-800 mx-0.5" />

              {/* ── NEW: Faker variables button ── */}
              <div className="relative">
                <button
                  onClick={() => {
                    setFakerOpen((v) => !v);
                    setHistoryOpen(false);
                    setPresetsOpen(false);
                  }}
                  title="Insert faker variable (Ctrl+Space)"
                  className={`flex items-center gap-1.5 text-[10px] transition-all px-2 py-1 rounded-md ${fakerOpen ? "text-violet-300 bg-zinc-800 border border-violet-500/30" : "text-zinc-600 hover:text-violet-300 hover:bg-zinc-800 border border-transparent"}`}
                >
                  <Sparkles className="w-3 h-3" />
                  Faker
                </button>
                {fakerOpen && (
                  <FakerVarsPanel
                    onInsert={handleInsertFakerVar}
                    onClose={() => setFakerOpen(false)}
                  />
                )}
              </div>

              {/* History */}
              <div className="relative">
                <button
                  onClick={() => {
                    setHistoryOpen((v) => !v);
                    setPresetsOpen(false);
                    setFakerOpen(false);
                  }}
                  className={`flex items-center gap-1.5 text-[10px] transition-all px-2 py-1 rounded-md ${historyOpen ? "text-zinc-200 bg-zinc-800" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}
                >
                  <History className="w-3 h-3" />
                  History
                  {history.length > 0 && (
                    <span className="text-[8px] font-mono text-zinc-500 bg-zinc-800 rounded px-1">
                      {history.length}
                    </span>
                  )}
                </button>
                {historyOpen && (
                  <HistoryDropdown
                    history={history}
                    onRestore={handleRestorePayload}
                    onClear={handleClearHistory}
                    onClose={() => setHistoryOpen(false)}
                  />
                )}
              </div>

              {/* Presets */}
              <div className="relative">
                <button
                  onClick={() => {
                    setPresetsOpen((v) => !v);
                    setHistoryOpen(false);
                    setFakerOpen(false);
                  }}
                  className={`flex items-center gap-1.5 text-[10px] transition-all px-2 py-1 rounded-md ${presetsOpen ? "text-zinc-200 bg-zinc-800" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}
                >
                  {presets.length > 0 ? (
                    <Bookmark className="w-3 h-3" />
                  ) : (
                    <BookmarkPlus className="w-3 h-3" />
                  )}
                  Presets
                  {presets.length > 0 && (
                    <span className="text-[8px] font-mono text-zinc-500 bg-zinc-800 rounded px-1">
                      {presets.length}
                    </span>
                  )}
                </button>
                {presetsOpen && (
                  <PresetsDropdown
                    presets={presets}
                    currentPayload={payload}
                    onLoad={handleRestorePayload}
                    onSave={handleSavePreset}
                    onDelete={handleDeletePreset}
                    onClose={() => setPresetsOpen(false)}
                  />
                )}
              </div>

              <div className="w-px h-4 bg-zinc-800 mx-0.5" />

              {/* Code gen */}
              <button
                onClick={() => setCodeGenOpen(true)}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-200 transition-all duration-150 px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800"
                title="Generate client code"
              >
                <Code2 className="w-3 h-3" />
                Code
              </button>

              <div className="w-px h-4 bg-zinc-800 mx-0.5" />

              {/* Emit */}
              <button
                onClick={handleEmit}
                disabled={!connected}
                title={connected ? "Emit event (Ctrl+Enter)" : "Connect first"}
                className={`relative flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                  emitSuccess
                    ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    : connected
                      ? "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-zinc-800 border-zinc-700 text-zinc-500"
                }`}
              >
                {emitSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Emitted!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {connected ? "Emit" : "Connect"}
                  </>
                )}
                {emitCount > 0 && !emitSuccess && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] font-mono font-bold bg-zinc-700 text-zinc-300 rounded-full w-4 h-4 flex items-center justify-center border border-zinc-600">
                    {emitCount > 99 ? "99+" : emitCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Monaco editor ── */}
          <div className="flex-1 min-h-0 relative">
            <div
              className={`absolute inset-0 rounded-xl overflow-hidden border transition-all duration-200 bg-[#1e1e1e] ${
                error
                  ? "border-red-500/40 shadow-[0_0_0_3px_rgba(239,68,68,0.06)]"
                  : "border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600"
              }`}
            >
              {editorReady ? (
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={payload}
                  onMount={handleEditorMount}
                  onChange={(val) => {
                    setPayload(val ?? "");
                    setError(null);
                  }}
                  theme="vs-dark"
                  options={{
                    ...BASE_EDITOR_OPTIONS,
                    tabSize: 2,
                    formatOnPaste: true,
                    formatOnType: true,
                    autoClosingBrackets: "always",
                    autoClosingQuotes: "always",
                    suggest: { showVariables: true },
                  }}
                />
              ) : (
                <EditorShimmer />
              )}
            </div>
          </div>
        </div>

        {/* ACK panel */}
        {lastAck !== undefined && (
          <AckPanel ack={lastAck} emitCount={emitCount} />
        )}

        {/* Multi-emit */}
        <MultiEmitPanel
          onMultiEmit={handleMultiEmit}
          disabled={
            !connected || tryParseJson(resolveFakerVars(payload)) === null
          }
        />

        {/* Error */}
        {error && (
          <EmitError message={error} onDismiss={() => setError(null)} />
        )}

        {/* Not connected */}
        {!connected && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
            <WifiOff className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <p className="text-xs text-zinc-600">
              Connect to a server from the navbar to emit events
            </p>
          </div>
        )}

        {connected && !emitSuccess && <ShortcutHint />}
      </div>

      <CodeGenPanel
        open={codeGenOpen}
        onClose={() => setCodeGenOpen(false)}
        event={selectedEvent}
        url={url}
        token={token}
        payload={payload}
      />
    </>
  );
}
