/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Editor, { useMonaco, type OnMount } from "@monaco-editor/react";
import type * as MonacoType from "monaco-editor";
import { useWsgateStore, type SelectedEvent } from "@/store/wsgate.store";
import { useSocketStore } from "@/hooks/useSocket";
import CodeGenPanel from "@/components/CodeGenPanel";
import ShortcutHint from "@/components/ShortcutHint";

// ── Helpers ───────────────────────────────────────────

/**
 * Converts a `@WsDoc()` payload type string into a JSON Schema definition.
 * Handles primitive types and pipe-separated enums.
 *
 * @param type - The type string from `WsDocOptions.payload`
 * @returns A JSON Schema-compatible object for Monaco diagnostics.
 *
 * @example
 * resolveJsonType('string')              // → { type: 'string' }
 * resolveJsonType('info | warn | error') // → { enum: ['info', 'warn', 'error'] }
 */
function resolveJsonType(type: string): object {
  const trimmed = type.trim();
  if (trimmed.includes("|")) {
    return { enum: trimmed.split("|").map((t) => t.trim()) };
  }
  switch (trimmed) {
    case "number":
    case "integer":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "string":
    default:
      return { type: "string" };
  }
}

/**
 * Generates a skeleton JSON object from a `@WsDoc()` payload schema.
 * Uses sensible default values based on each field's type.
 *
 * @param payload - The payload schema from `WsEvent`.
 * @returns A plain object with default values for each field.
 *
 * @example
 * buildPayloadSkeleton({ room: 'string', count: 'number' })
 * // → { room: '', count: 0 }
 */
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

// ── Constants ─────────────────────────────────────────

/**
 * Base Monaco editor options shared between the emit editor
 * and the subscribe read-only preview.
 */
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

/**
 * Icon and color config per payload field type.
 * Used to render the schema pill icons.
 */
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
    color: "text-pink-400  border-pink-500/30   bg-pink-500/5",
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

/** Resolves the display config for a given type string. */
function getTypeConfig(type: string) {
  const t = type.trim();
  if (t.includes("|")) return TYPE_ICON.enum;
  return TYPE_ICON[t] ?? TYPE_ICON.default;
}

// ── Sub-components ────────────────────────────────────

/**
 * Shimmer skeleton shown while the Monaco editor is loading.
 */
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

/**
 * Shimmer skeleton for the full panel while the editor initializes.
 */
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

// ─────────────────────────────────────────────────────

/**
 * Inline error banner shown when the emit fails due to
 * invalid JSON or other parse errors.
 *
 * @param message   - The error message to display.
 * @param onDismiss - Callback to dismiss the error.
 */
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

// ─────────────────────────────────────────────────────

/**
 * Renders the event name, gateway, handler badges, type chip,
 * and description — shared between emit and subscribe views.
 *
 * @param event - The selected WsEvent.
 */
function EventHeader({ event }: { event: SelectedEvent }) {
  const isEmit = event.type === "emit";
  const nsDisplay =
    event.namespace === "/"
      ? "Global"
      : (event.namespace?.slice(1).toUpperCase() ?? "GLOBAL");

  return (
    <div className="flex flex-col gap-3 pb-4 border-b border-zinc-800/80 shrink-0">
      {/* Namespace tag — top visual indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-[9px] font-mono font-semibold text-blue-300 uppercase tracking-widest">
          {nsDisplay} Namespace
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
              isEmit
                ? "bg-blue-500/15 border border-blue-500/30"
                : "bg-emerald-500/15 border border-emerald-500/30"
            }`}
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
          className={`shrink-0 text-xs gap-1 ${
            isEmit
              ? "border-blue-500/40 text-blue-400 bg-blue-500/5"
              : "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
          }`}
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
        {/* Namespace badge — prominent visual indicator */}
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

// ─────────────────────────────────────────────────────

/**
 * Renders typed schema pills for a given payload definition.
 *
 * @param payload - The payload schema map from `WsEvent`.
 * @param label   - Section label shown above the pills.
 */
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

// ─────────────────────────────────────────────────────

/**
 * Copy-to-clipboard button with a brief ✓ confirmation state.
 *
 * @param text - The string to copy.
 */
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

// ── Component ─────────────────────────────────────────

/**
 * Center panel for the nestjs-wsgate UI.
 *
 * Reads selected event from `useWsgateStore`.
 * Reads socket emit and status from `useSocketStore`.
 * Zero props — fully store-driven.
 *
 * Layout:
 * - `flex flex-col h-full overflow-hidden` outer container
 * - Static sections: `shrink-0`
 * - Editor: `flex-1 min-h-0 relative` → `absolute inset-0` gives Monaco
 *   a concrete pixel height without hardcoding px values
 *
 * Emit button lives in the editor toolbar (top-right of editor area)
 * for minimal distance between editing and sending.
 *
 * Code generation opens as a full modal via the `<CodeGenPanel>` component.
 *
 * **emit** — Client → Server
 * - Monaco JSON editor with schema validation and autocomplete
 * - Auto-generated payload skeleton from `@WsDoc()` metadata
 * - Editor toolbar: Copy · Format · Reset · Code · [Emit button]
 * - Ctrl+Enter keyboard shortcut
 *
 * **subscribe** — Server → Client
 * - Read-only Monaco JSON preview of the expected response shape
 * - Info note directing users to watch the Event Log
 */
export default function EventPanel() {
  // ── Stores ────────────────────────────────────────────

  const { selectedEvent, addLog, url, token, selectedNamespace } =
    useWsgateStore();
  const { emit, status, disconnect } = useSocketStore();
  const connected = status === "connected";

  // ── State ─────────────────────────────────────────────

  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [emitSuccess, setEmitSuccess] = useState(false);
  const [codeGenOpen, setCodeGenOpen] = useState(false);

  /**
   * Ref to the Monaco editor instance.
   * Used to call `formatDocument` imperatively.
   */
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const monaco = useMonaco();

  // ── Editor mount ──────────────────────────────────────

  /**
   * Captures the Monaco editor instance on mount.
   * Runs an initial format pass on the auto-generated skeleton.
   */
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    setTimeout(() => {
      editor.getAction("editor.action.formatDocument")?.run();
    }, 100);
  };

  // ── Reset on event change ─────────────────────────────

  useEffect(() => {
    setEditorReady(false);
    const timer = setTimeout(() => setEditorReady(true), 300);
    return () => clearTimeout(timer);
  }, [selectedEvent]);

  // ── Auto-disconnect when event namespace changes ─────

  /**
   * If the user selects a different event in a different namespace,
   * automatically disconnect the old socket connection to prevent
   * message routing conflicts.
   */
  useEffect(() => {
    if (!selectedEvent) return;
    const eventNamespace = selectedEvent.namespace ?? "/";
    const connected = status === "connected";

    // If the event's namespace differs from the selected namespace AND socket is connected
    if (eventNamespace !== selectedNamespace && connected) {
      disconnect();
    }
  }, [selectedEvent, selectedNamespace, status, disconnect]);

  // ── Auto-generate payload skeleton ───────────────────

  /**
   * When a new event is selected, populate the Monaco editor
   * with a skeleton JSON object derived from the event's payload schema.
   * Triggers a format pass 150ms after value is applied.
   */
  useEffect(() => {
    if (!selectedEvent) return;
    const skeleton = buildPayloadSkeleton(selectedEvent.payload ?? {});
    setPayload(JSON.stringify(skeleton, null, 2));
    setError(null);
    setEmitSuccess(false);
    setTimeout(() => {
      editorRef.current?.getAction("editor.action.formatDocument")?.run();
    }, 150);
  }, [selectedEvent]);

  // ── Monaco JSON schema registration ──────────────────

  /**
   * Registers a JSON Schema with Monaco's JSON language service
   * when the selected event changes. Enables field autocomplete,
   * type validation, and squiggle errors for unknown fields.
   *
   * Only applied for `emit` events — subscribe events are read-only.
   */
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

  // ── Handlers ──────────────────────────────────────────

  /**
   * Parses the Monaco editor content as JSON and emits the event.
   * Logs the emitted event to the store on success.
   * Shows an inline error banner if the JSON is malformed.
   */
  function handleEmit() {
    if (!selectedEvent || !connected) return;
    try {
      const parsed = JSON.parse(payload);
      setError(null);
      emit(selectedEvent.event, parsed);
      addLog("out", selectedEvent.event, parsed);
      setEmitSuccess(true);
      setTimeout(() => setEmitSuccess(false), 1500);
    } catch {
      setError("Invalid JSON — check your payload syntax");
    }
  }

  /**
   * Triggers Monaco's built-in `formatDocument` action.
   * Equivalent to pressing Alt+Shift+F in the editor.
   */
  function handleFormat() {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }

  /** Resets the payload editor back to the auto-generated skeleton. */
  function handleReset() {
    if (!selectedEvent) return;
    const skeleton = buildPayloadSkeleton(selectedEvent.payload ?? {});
    setPayload(JSON.stringify(skeleton, null, 2));
    setError(null);
    setTimeout(() => {
      editorRef.current?.getAction("editor.action.formatDocument")?.run();
    }, 100);
  }

  /**
   * Global keyboard shortcut — Ctrl+Enter / Cmd+Enter to emit.
   * Only fires when the socket is connected and an emit event is selected.
   */
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

  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <MousePointerClick className="w-7 h-7 text-zinc-700" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/30" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-zinc-700" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-semibold text-zinc-300">
            No event selected
          </p>
          <p className="text-xs text-zinc-600 text-center leading-relaxed">
            Pick an event from the sidebar
            <br />
            to compose and emit a payload
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-700">
          <ArrowDownLeft className="w-3.5 h-3.5 rotate-45" />
          <span>from the sidebar</span>
        </div>
      </div>
    );
  }

  // ── Shimmer while editor initializes ─────────────────

  if (!editorReady) return <PanelShimmer />;

  // ── Subscribe view — server → client ──────────────────

  if (selectedEvent.type === "subscribe") {
    return (
      <div className="flex flex-col h-full overflow-hidden p-5 gap-4">
        <EventHeader event={selectedEvent} />
        <SchemaPills
          payload={selectedEvent.payload ?? {}}
          label="Response Shape"
        />

        {/* Toolbar */}
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

        {/* Editor */}
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

        {/* Info note */}
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

  // ── Emit view — client → server ───────────────────────

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden p-5 gap-4">
        {/* Event header */}
        <EventHeader event={selectedEvent} />

        {/* Payload schema pills */}
        <SchemaPills
          payload={selectedEvent.payload ?? {}}
          label="Payload Schema"
        />

        {/* Response event */}
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
          {/* ── Editor toolbar — all actions including emit ── */}
          <div className="flex items-center justify-between shrink-0">
            {/* Left — label */}
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Payload (JSON)
            </span>

            {/* Right — utility actions + emit */}
            <div className="flex items-center gap-1">
              {/* Copy payload */}
              <CopyButton text={payload} />

              {/* Format — Monaco formatDocument */}
              <button
                onClick={handleFormat}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                title="Format JSON (Alt+Shift+F)"
              >
                <Braces className="w-3 h-3" />
                Format
              </button>

              {/* Reset to skeleton */}
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                title="Reset to skeleton"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-zinc-800 mx-1" />

              {/* Code generation — opens modal */}
              <button
                onClick={() => setCodeGenOpen(true)}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-200 transition-all duration-150 px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800"
                title="Generate client code"
              >
                <Code2 className="w-3 h-3" />
                Code
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-zinc-800 mx-1" />

              {/* ── Emit button — lives in toolbar, top-right of editor ── */}
              <button
                onClick={handleEmit}
                disabled={!connected}
                title={connected ? "Emit event (Ctrl+Enter)" : "Connect first"}
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed ${
                    emitSuccess
                      ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : connected
                        ? "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-800/50 hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-zinc-800 border-zinc-700 text-zinc-500"
                  }`}
              >
                {emitSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Emitted!
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {connected ? "Emit" : "Connect"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Monaco editor — flex-1 min-h-0 + absolute inset-0 ── */}
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
                  }}
                />
              ) : (
                <EditorShimmer />
              )}
            </div>
          </div>
        </div>

        {/* Emit error banner */}
        {error && (
          <EmitError message={error} onDismiss={() => setError(null)} />
        )}

        {/* Not connected warning */}
        {!connected && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
            <WifiOff className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <p className="text-xs text-zinc-600">
              Connect to a server from the navbar to emit events
            </p>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        {connected && !emitSuccess && <ShortcutHint />}
      </div>

      {/* ── Code generation modal ── */}
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
