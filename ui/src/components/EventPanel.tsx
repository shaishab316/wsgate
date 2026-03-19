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
import type { WsEvent } from "@/types/ws-event";

// ── Types ─────────────────────────────────────────────

interface Props {
  /** The currently selected WebSocket event, or `null` if none selected. */
  event: WsEvent | null;

  /** Whether the Socket.IO connection is currently active. */
  connected: boolean;

  /**
   * Emits a Socket.IO event to the server.
   *
   * @param event   - The event name to emit.
   * @param payload - The parsed JSON payload to send.
   */
  emit: (event: string, payload: unknown) => void;

  /**
   * Logs an emitted event to the event log panel.
   *
   * @param event - The event name that was emitted.
   * @param data  - The payload that was sent.
   */
  onLog: (event: string, data: unknown) => void;
}

// ── Helpers ───────────────────────────────────────────

/**
 * Converts a `@WsDoc()` payload type string into a JSON Schema definition.
 * Handles primitive types and pipe-separated enums.
 *
 * @param type - The type string from `WsDocOptions.payload` (e.g. `'string'`, `'info | warn | error'`).
 * @returns A JSON Schema-compatible object for use in Monaco diagnostics.
 *
 * @example
 * resolveJsonType('string')           // → { type: 'string' }
 * resolveJsonType('info | warn | error') // → { enum: ['info', 'warn', 'error'] }
 */
function resolveJsonType(type: string): object {
  const trimmed = type.trim();

  // Pipe-separated values → JSON Schema enum
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
 * Generates a default payload skeleton object from a `@WsDoc()` payload schema.
 * Uses sensible default values based on the field type.
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

// ── Component ─────────────────────────────────────────

/**
 * Center panel for the nestjs-wsgate UI.
 *
 * Displays full details of the selected `@WsDoc()` event and provides
 * a Monaco JSON editor for composing the event payload before emitting.
 *
 * Features:
 * - Auto-generates a payload skeleton from the event schema on selection
 * - Registers a JSON Schema with Monaco for field validation and autocomplete
 * - Validates JSON before emitting and shows inline error feedback
 * - Shows gateway name, handler name, event type, and response event
 */
export default function EventPanel({ event, connected, emit, onLog }: Props) {
  // ── State ────────────────────────────────────────────

  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const monaco = useMonaco();

  // ── Auto-generate payload skeleton ───────────────────

  /**
   * When a new event is selected, automatically populate the Monaco editor
   * with a skeleton JSON object derived from the event's payload schema.
   */
  useEffect(() => {
    if (!event) return;
    const skeleton = buildPayloadSkeleton(event.payload ?? {});
    setPayload(JSON.stringify(skeleton, null, 2));
    setError(null);
  }, [event]);

  // ── Monaco JSON schema registration ──────────────────

  /**
   * Registers a JSON Schema with Monaco's JSON language service
   * whenever the selected event changes. This enables:
   * - Field name autocomplete
   * - Type validation (string, number, boolean, enum)
   * - Squiggle errors for unknown or missing fields
   */
  useEffect(() => {
    if (!monaco || !event) return;

    const properties = Object.fromEntries(
      Object.entries(event.payload ?? {}).map(([key, type]) => [
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
          uri: `ws://wsgate/event/${event.event}`,
          fileMatch: ["*"],
          schema: {
            type: "object",
            properties,
            required: Object.keys(event.payload ?? {}),
            additionalProperties: false,
          },
        },
      ],
    });
  }, [monaco, event]);

  // ── Emit handler ──────────────────────────────────────

  /**
   * Parses the current editor content as JSON and emits the event.
   * Logs the emitted event to the event log panel on success.
   * Shows an inline error if the JSON is malformed.
   */
  function handleEmit() {
    if (!event) return;
    try {
      const parsed = JSON.parse(payload);
      setError(null);
      emit(event.event, parsed);
      onLog(event.event, parsed);
    } catch {
      setError("Invalid JSON payload");
    }
  }

  // ── Empty state ───────────────────────────────────────

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
          <span className="text-zinc-600 text-lg">↑</span>
        </div>
        <p className="text-sm text-zinc-600">Select an event to emit</p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Event header — name, gateway, handler, type */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-semibold font-mono text-zinc-100">
            {event.event}
          </h2>
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-400 text-xs"
          >
            {event.gatewayName}
          </Badge>
          <Badge
            variant="outline"
            className="border-zinc-600 text-zinc-500 text-xs"
          >
            {event.handlerName}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${
              event.type === "emit"
                ? "border-blue-500 text-blue-400"
                : "border-green-500 text-green-400"
            }`}
          >
            {event.type}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500">{event.description}</p>
      </div>

      {/* Payload schema — field names and their types */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Payload Schema
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(event.payload ?? {}).map(([key, type]) => (
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
          {event.response}
        </span>
      </div>

      {/* Monaco JSON editor */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Payload (JSON)
          </span>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>

        <div
          className={`flex-1 rounded-md overflow-hidden border transition-colors ${
            error ? "border-red-500" : "border-zinc-700"
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
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "JetBrains Mono, Fira Code, monospace",
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              folding: false,
              renderLineHighlight: "none",
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: { vertical: "hidden", horizontal: "hidden" },
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
      </div>

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
