/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useWsgateStore } from "@/store/wsgate.store";
import { useSocketStore } from "@/hooks/useSocket";

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

// ── Shared editor options ─────────────────────────────

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
  scrollbar: { vertical: "hidden" as const, horizontal: "hidden" as const },
  padding: { top: 12, bottom: 12 },
};

// ── Shimmer ───────────────────────────────────────────

/**
 * Shimmer skeleton shown while the Monaco editor is loading.
 */
function EditorShimmer() {
  return (
    <div className="flex-1 rounded-md overflow-hidden border border-zinc-700 bg-zinc-900 p-3 flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-zinc-800 animate-pulse"
          style={{ width: `${30 + (i % 4) * 15}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for the header badges and schema pills
 * while the event panel is first rendering.
 */
function PanelShimmer() {
  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Header shimmer */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-32 rounded bg-zinc-800 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-5 w-24 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="h-3 w-48 rounded bg-zinc-800/70 animate-pulse" />
      </div>

      {/* Schema pills shimmer */}
      <div className="flex flex-col gap-2">
        <div className="h-2.5 w-24 rounded bg-zinc-800 animate-pulse" />
        <div className="flex gap-2">
          {[60, 80, 50].map((w, i) => (
            <div
              key={i}
              className="h-5 rounded bg-zinc-800 animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Response shimmer */}
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-16 rounded bg-zinc-800 animate-pulse" />
        <div className="h-5 w-24 rounded bg-zinc-800 animate-pulse" />
      </div>

      {/* Editor shimmer */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="h-2.5 w-20 rounded bg-zinc-800 animate-pulse mb-1" />
        <EditorShimmer />
      </div>

      {/* Button shimmer */}
      <div className="h-9 w-full rounded-md bg-zinc-800 animate-pulse" />
    </div>
  );
}

// ── Emit error ────────────────────────────────────────

/**
 * Inline error banner shown when the emit fails due to
 * invalid JSON or other parse errors.
 *
 * @param message - The error message to display.
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
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/5 border border-red-500/20">
      <div className="shrink-0 w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg
          className="w-2.5 h-2.5 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <p className="text-xs text-red-400 flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="text-zinc-600 hover:text-zinc-400 text-xs shrink-0 transition-colors"
      >
        ✕
      </button>
    </div>
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
 * Renders one of two views depending on the selected event type:
 *
 * **emit** — Client → Server
 * - Monaco JSON editor with schema validation and autocomplete
 * - Auto-generated payload skeleton from `@WsDoc()` metadata
 * - Emit button (disabled until connected)
 *
 * **subscribe** — Server → Client
 * - Read-only Monaco JSON preview of the expected response shape
 * - Info note directing users to watch the Event Log
 */
export default function EventPanel() {
  // ── Stores ────────────────────────────────────────────

  const { selectedEvent, addLog } = useWsgateStore();
  const { emit, status } = useSocketStore();
  const connected = status === "connected";

  // ── State ────────────────────────────────────────────

  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const monaco = useMonaco();

  // ── Reset editor ready on event change ───────────────

  useEffect(() => {
    setEditorReady(false);
    const timer = setTimeout(() => setEditorReady(true), 300);
    return () => clearTimeout(timer);
  }, [selectedEvent]);

  // ── Auto-generate payload skeleton ───────────────────

  /**
   * When a new event is selected, populate the Monaco editor
   * with a skeleton JSON object derived from the event's payload schema.
   */
  useEffect(() => {
    if (!selectedEvent) return;
    const skeleton = buildPayloadSkeleton(selectedEvent.payload ?? {});
    setPayload(JSON.stringify(skeleton, null, 2));
    setError(null);
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

  // ── Emit handler ──────────────────────────────────────

  /**
   * Parses the Monaco editor content as JSON and emits the event.
   * Logs the emitted event to the store on success.
   * Shows an inline error banner if the JSON is malformed.
   */
  function handleEmit() {
    if (!selectedEvent) return;
    try {
      const parsed = JSON.parse(payload);
      setError(null);
      emit(selectedEvent.event, parsed);
      addLog("out", selectedEvent.event, parsed);
    } catch {
      setError("Invalid JSON — check your payload syntax");
    }
  }

  // ── Empty state ───────────────────────────────────────

  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
          <span className="text-zinc-600 text-lg">↑</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-zinc-400 font-medium">No event selected</p>
          <p className="text-xs text-zinc-600">
            Pick an event from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  // ── Shimmer while editor initializes ─────────────────

  if (!editorReady) {
    return <PanelShimmer />;
  }

  // ── Subscribe view — server → client ──────────────────

  if (selectedEvent.type === "subscribe") {
    return (
      <div className="flex flex-col h-full p-5 gap-4">
        {/* Event header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold font-mono text-zinc-100">
              {selectedEvent.event}
            </h2>
            <Badge
              variant="outline"
              className="border-blue-500 text-blue-400 text-xs"
            >
              {selectedEvent.gatewayName}
            </Badge>
            <Badge
              variant="outline"
              className="border-zinc-600 text-zinc-500 text-xs"
            >
              {selectedEvent.handlerName}
            </Badge>
            <Badge
              variant="outline"
              className="border-green-500 text-green-400 text-xs"
            >
              subscribe
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">{selectedEvent.description}</p>
        </div>

        {/* Response shape — field names and types */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Response Shape
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedEvent.payload ?? {}).map(([key, type]) => (
              <span
                key={key}
                className="text-xs font-mono bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400"
              >
                {key}: <span className="text-green-400">{type}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Read-only Monaco preview of response shape */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Example Response
          </span>
          <div className="flex-1 rounded-md overflow-hidden border border-zinc-700">
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/5 border border-green-500/20">
          <span className="text-green-400 text-xs">↓</span>
          <p className="text-xs text-zinc-500">
            This event is emitted by the server. Watch the{" "}
            <span className="text-zinc-300">Event Log</span> for incoming
            payloads.
          </p>
        </div>
      </div>
    );
  }

  // ── Emit view — client → server ───────────────────────

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Event header — name, gateway, handler, type */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-semibold font-mono text-zinc-100">
            {selectedEvent.event}
          </h2>
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-400 text-xs"
          >
            {selectedEvent.gatewayName}
          </Badge>
          <Badge
            variant="outline"
            className="border-zinc-600 text-zinc-500 text-xs"
          >
            {selectedEvent.handlerName}
          </Badge>
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-400 text-xs"
          >
            emit
          </Badge>
        </div>
        <p className="text-xs text-zinc-500">{selectedEvent.description}</p>
      </div>

      {/* Payload schema — field names and their types */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Payload Schema
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedEvent.payload ?? {}).map(([key, type]) => (
            <span
              key={key}
              className="text-xs font-mono bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400"
            >
              {key}: <span className="text-blue-400">{type}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Response event name */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Response
        </span>
        <span className="text-xs font-mono text-green-400 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5">
          {selectedEvent.response}
        </span>
      </div>

      {/* Monaco JSON editor */}
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Payload (JSON)
        </span>

        <div
          className={`flex-1 rounded-md overflow-hidden border transition-colors ${
            error ? "border-red-500/50" : "border-zinc-700"
          }`}
        >
          <Editor
            height="100%"
            defaultLanguage="json"
            value={payload}
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
        </div>
      </div>

      {/* Emit error banner */}
      {error && <EmitError message={error} onDismiss={() => setError(null)} />}

      {/* Emit button — disabled until connected */}
      <Button
        onClick={handleEmit}
        disabled={!connected}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connected ? "Emit Event" : "Connect to emit"}
      </Button>
    </div>
  );
}
