/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import Editor, { type OnMount, useMonaco } from "@monaco-editor/react";
import {
  ArrowDownLeft,
  Bookmark,
  BookmarkPlus,
  Braces,
  Check,
  Code2,
  History,
  Radio,
  RotateCcw,
  Send,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import type * as MonacoType from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeGenPanel from "@/components/sub-components/CodeGenPanel";
import ShortcutHint from "@/components/sub-components/ShortcutHint";
import { useSocketStore } from "@/hooks/useSocket";
import { buildFakerCompletions, resolveFakerVars } from "@/lib/faker";
import {
  buildPayloadSkeleton,
  loadFromStorage,
  resolveJsonType,
  saveToStorage,
  shortId,
  storageKey,
  tryParseJson,
} from "@/lib/utils";
import { useWsgateStore } from "@/store/wsgate.store";
import { FakerBadge } from "./badge/FakerBadge";
import { JsonValidityBadge } from "./badge/JsonValidityBadge";
import { ModifiedBadge } from "./badge/ModifiedBadge";
import { EditorShimmer } from "./shimmer/EditorShimmer";
import { PanelShimmer } from "./shimmer/PanelShimmer";
import { AckPanel } from "./sub-components/AckPanel";
import { BASE_EDITOR_OPTIONS, HISTORY_LIMIT } from "./sub-components/Config";
import { CopyButton } from "./sub-components/CopyButton";
import { EmitError } from "./sub-components/EmitError";
import EmptyState from "./sub-components/EmptyState";
import { EventHeader } from "./sub-components/EventHeader";
import { FakerVarsPanel } from "./sub-components/FakerVarsPanel";
import {
  HistoryDropdown,
  type HistoryEntry,
} from "./sub-components/HistoryDropdown";
import {
  MultiEmitPanel,
  type MultiEmitResult,
} from "./sub-components/MultiEmitPanel";
import { type Preset, PresetsDropdown } from "./sub-components/PresetsDropdown";
import { SchemaPills } from "./sub-components/SchemaPills";

/**
 * EventPanel component for emitting and managing WebSocket events.
 *
 * Provides a comprehensive interface for:
 * - Editing and emitting event payloads with Monaco editor
 * - Managing event history and presets
 * - Faker variable insertion for dynamic payload generation
 * - Real-time JSON validation with Monaco schemas
 * - Multi-emit support with configurable delays
 * - Acknowledgment tracking for emit responses
 * - Code generation for client implementations
 *
 * @component
 * @example
 * // Displays empty state if no event selected
 * <EventPanel />
 *
 * @returns {React.ReactElement | null} The EventPanel UI with editor, controls, and status displays.
 *   Returns `<EmptyState />` if no event is selected.
 *   Returns `<PanelShimmer />` while editor is initializing.
 *   Returns subscribe view for listen-only events.
 *   Returns full emit interface for emittable events.
 *
 * @remarks
 * - Uses Monaco Editor for JSON payload editing with schema validation
 * - Stores emit history and presets in browser localStorage per event
 * - Supports Ctrl+Enter keyboard shortcut for quick emit
 * - Automatically formats JSON on mount and after restoration
 * - Provides completion hints for faker variables ({{$var}})
 * - Tracks emit count and shows success feedback with 1.5s animation
 * - Auto-disconnects if event namespace doesn't match selected namespace
 * - Handles ack callbacks and timeout detection (3s) for multi-emit
 *
 * @dependencies
 * - `useWsgateStore` - Event selection, logging, and connection state
 * - `useSocketStore` - WebSocket emit and status management
 * - `useMonaco` - Monaco editor instance
 * - Monaco Editor (@monaco-editor/react)
 */
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
  const [emitting, setEmitting] = useState(false);

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to reset editorReady when selectedEvent changes, not skeletonJson
  useEffect(() => {
    setEditorReady(false);
    const t = setTimeout(() => setEditorReady(true), 300);
    return () => clearTimeout(t);
  }, [selectedEvent]);

  // ── Auto-disconnect ───────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run this effect when selectedEvent or selectedNamespace changes, not status or disconnect function reference
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
    // biome-ignore lint/suspicious/noExplicitAny: Monaco's typings don't expose jsonDefaults
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
    if (!selectedEvent || !connected || emitting) return;
    setEmitting(true);

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
    setTimeout(() => {
      setEmitSuccess(false);
      setEmitting(false);
    }, 1500);
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
      if (!selectedEvent || !connected || emitting) return [];

      setEmitting(true);

      const resolved = resolveFakerVars(payload);
      const parsed = tryParseJson(resolved);
      if (!parsed) {
        setEmitting(false);
        return [];
      }

      const results: MultiEmitResult[] = [];

      for (let i = 0; i < count; i++) {
        await new Promise<void>((resolve) => {
          let settled = false;

          const logId = addLog("out", selectedEvent.event, parsed);

          emit(selectedEvent.event, parsed, (ackData: unknown) => {
            if (settled) return;
            settled = true;

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
            if (settled) return;
            settled = true;

            results.push({
              index: i,
              ack: null,
              sentAt: new Date().toISOString(),
              ok: false,
            });
            resolve();
          }, 3000);
        });

        if (i < count - 1 && delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      setEmitCount((c) => c + count);
      setEmitting(false);
      return results;
    },
    [selectedEvent, connected, emitting, payload, emit, addLog, addAck],
  );

  // ── Keyboard shortcut ─────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: We want this effect to re-run when selectedEvent or connected changes, but not when payload or error changes, to avoid re-attaching the event listener on every keystroke or error state change.
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
          type="button"
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
          type="button"
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
                type="button"
              >
                <Braces className="w-3 h-3" />
                Format
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                title="Reset to skeleton"
                type="button"
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
                  type="button"
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
                  type="button"
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
                  type="button"
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
                type="button"
              >
                <Code2 className="w-3 h-3" />
                Code
              </button>

              <div className="w-px h-4 bg-zinc-800 mx-0.5" />

              <div className="relative">
                {emitSuccess ? (
                  <span className="invert dark:invert-0 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    <Check className="w-4 h-4" />
                    Emitted!
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleEmit}
                    disabled={!connected || emitting}
                    title={
                      connected ? "Emit event (Ctrl+Enter)" : "Connect first"
                    }
                    className={`invert dark:invert-0 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                      connected
                        ? "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {connected ? "Emit" : "Connect"}
                  </button>
                )}

                {emitCount > 0 && !emitSuccess && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] font-mono font-bold bg-zinc-700 text-zinc-300 rounded-full w-4 h-4 flex items-center justify-center border border-zinc-600 pointer-events-none">
                    {emitCount > 99 ? "99+" : emitCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Monaco editor ── */}
          <div className="flex-1 min-h-0 relative invert dark:invert-0">
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
