/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import Editor from "@monaco-editor/react";
import {
  Braces,
  Check,
  Code2,
  Copy,
  Star,
  StarOff,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { SelectedEvent } from "@/store/wsgate.store";

// ── Types ─────────────────────────────────────────────

/**
 * All supported code generation target languages.
 */
export type CodeLang =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "java"
  | "csharp"
  | "php"
  | "ruby"
  | "dart"
  | "wscat";

/**
 * Visual and Monaco language config per codegen tab.
 */
interface CodeLangConfig {
  label: string;
  monacoId: string;
  badge: string;
  color: string;
  dot: string;
}

// ── Props ─────────────────────────────────────────────

/**
 * Props for the CodeGenPanel modal component.
 */
export interface CodeGenPanelProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Called to close the modal. */
  onClose: () => void;
  /** Currently selected WsEvent. */
  event: SelectedEvent;
  /** Socket.IO server URL from store. */
  url: string;
  /** Optional Bearer token from store. */
  token: string;
  /** Current JSON payload string from the editor. */
  payload: string;
}

// ── Constants ─────────────────────────────────────────

/**
 * Display and Monaco language config for each supported codegen tab.
 */
const CODE_LANGS: Record<CodeLang, CodeLangConfig> = {
  typescript: {
    label: "TypeScript",
    monacoId: "typescript",
    badge: "TS",
    dot: "#3b82f6",
    color: "text-blue-400   bg-blue-500/10   border-blue-500/30",
  },
  javascript: {
    label: "JavaScript",
    monacoId: "javascript",
    badge: "JS",
    dot: "#eab308",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  },
  python: {
    label: "Python",
    monacoId: "python",
    badge: "PY",
    dot: "#22c55e",
    color: "text-green-400  bg-green-500/10  border-green-500/30",
  },
  go: {
    label: "Go",
    monacoId: "go",
    badge: "GO",
    dot: "#06b6d4",
    color: "text-cyan-400   bg-cyan-500/10   border-cyan-500/30",
  },
  java: {
    label: "Java",
    monacoId: "java",
    badge: "JV",
    dot: "#f97316",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  },
  csharp: {
    label: "C#",
    monacoId: "csharp",
    badge: "C#",
    dot: "#a855f7",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
  php: {
    label: "PHP",
    monacoId: "php",
    badge: "PHP",
    dot: "#818cf8",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  },
  ruby: {
    label: "Ruby",
    monacoId: "ruby",
    badge: "RB",
    dot: "#f43f5e",
    color: "text-rose-400   bg-rose-500/10   border-rose-500/30",
  },
  dart: {
    label: "Dart",
    monacoId: "dart",
    badge: "DT",
    dot: "#0ea5e9",
    color: "text-sky-400    bg-sky-500/10    border-sky-500/30",
  },
  wscat: {
    label: "wscat CLI",
    monacoId: "shell",
    badge: "$_",
    dot: "#71717a",
    color: "text-zinc-300   bg-zinc-800      border-zinc-600",
  },
};

/**
 * Ordered list of language tab IDs rendered in the tab strip.
 */
const LANG_ORDER: CodeLang[] = [
  "typescript",
  "javascript",
  "python",
  "go",
  "java",
  "csharp",
  "php",
  "ruby",
  "dart",
  "wscat",
];

/**
 * Install command hint shown in the panel footer per language.
 */
const INSTALL_HINT: Record<CodeLang, string> = {
  typescript: "pnpm add socket.io-client",
  javascript: "pnpm add socket.io-client",
  python: "pip install python-socketio",
  go: "go get github.com/googollee/go-socket.io",
  java: "implementation 'io.socket:socket.io-client:2.1.0'",
  csharp: "dotnet add package SocketIOClient",
  php: "composer require elephantio/elephant.io",
  ruby: "gem install socket.io-client-simple",
  dart: "flutter pub add socket_io_client",
  wscat: "npm install -g wscat",
};

// ── Editor options ────────────────────────────────────

/**
 * Read-only Monaco editor options — compact, code-focused.
 * Small font, tight padding, no decorations — maximises code visibility.
 */
const CODEGEN_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 12,
  lineHeight: 18,
  fontFamily: "JetBrains Mono, Fira Code, monospace",
  lineNumbers: "on" as const,
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  folding: false,
  renderLineHighlight: "none" as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "hidden" as const,
    verticalScrollbarSize: 4,
  },
  padding: { top: 8, bottom: 8 },
  readOnly: false,
  contextmenu: false,
  glyphMargin: false,
  lineDecorationsWidth: 10,
  lineNumbersMinChars: 3,
};

// ── Helpers ───────────────────────────────────────────

/**
 * Generates a ready-to-run Socket.IO client snippet for the given language.
 *
 * Token is injected as `auth: { token }` when present.
 * Payload string is embedded verbatim — caller is responsible for
 * passing a valid JSON string.
 *
 * @param lang    - Target language/runtime.
 * @param url     - Socket.IO server URL.
 * @param token   - Optional Bearer token.
 * @param event   - The event name to emit.
 * @param payload - The JSON payload string from the editor.
 * @returns A formatted, ready-to-run code string.
 */
function generateCode(
  lang: CodeLang,
  url: string,
  token: string,
  event: string,
  payload: string,
): string {
  const authTs = token ? `,\n  { auth: { token: "${token}" } }` : "";
  const authPython = token ? `,\n    auth={"token": "${token}"}` : "";

  switch (lang) {
    case "typescript":
      return `import { io } from "socket.io-client";

const socket = io("${url}"${authTs});

socket.on("connect", () => {
  console.log("✓ connected:", socket.id);
  socket.emit("${event}", ${payload});
});

socket.on("disconnect", (reason) => {
  console.log("✗ disconnected:", reason);
});`;

    case "javascript":
      return `const { io } = require("socket.io-client");

const socket = io("${url}"${authTs});

socket.on("connect", () => {
  console.log("✓ connected:", socket.id);
  socket.emit("${event}", ${payload});
});

socket.on("disconnect", (reason) => {
  console.log("✗ disconnected:", reason);
});`;

    case "python":
      return `import socketio

sio = socketio.SimpleClient()

sio.connect("${url}"${authPython})
print(f"✓ connected: {sio.sid}")

sio.emit("${event}", ${payload})

event_name, data = sio.receive()
print(f"← {event_name}:", data)

sio.disconnect()`;

    case "go":
      return `package main

import (
  "fmt"
  "os"
  gosocketio "github.com/googollee/go-socket.io/client"
)

func main() {
  ${
    token
      ? `headers := map[string]string{\n    "Authorization": "Bearer ${token}",\n  }\n  c, err := gosocketio.Dial("${url}", headers)`
      : `c, err := gosocketio.Dial("${url}", nil)`
  }
  if err != nil {
    fmt.Println("connect error:", err)
    os.Exit(1)
  }
  defer c.Close()

  fmt.Println("✓ connected")
  c.Emit("${event}", ${payload})
  select {}
}`;

    case "java":
      return `import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONObject;
import java.net.URI;

public class WsgateClient {
  public static void main(String[] args) throws Exception {
    IO.Options opts = new IO.Options();${token ? `\n    opts.auth = java.util.Map.of("token", "${token}");` : ""}

    Socket socket = IO.socket(URI.create("${url}"), opts);

    socket.on(Socket.EVENT_CONNECT, args2 -> {
      System.out.println("✓ connected: " + socket.id());
      JSONObject payload = new JSONObject(${JSON.stringify(payload)});
      socket.emit("${event}", payload);
    });

    socket.on(Socket.EVENT_DISCONNECT, args2 -> {
      System.out.println("✗ disconnected");
    });

    socket.connect();
  }
}`;

    case "csharp":
      return `using SocketIOClient;
using System;
using System.Threading.Tasks;

var socket = new SocketIO("${url}"${token ? `,\n  new SocketIOOptions { Auth = new { token = "${token}" } }` : ""});

socket.OnConnected += async (sender, e) => {
  Console.WriteLine($"✓ connected: {socket.Id}");
  await socket.EmitAsync("${event}", ${payload});
};

socket.OnDisconnected += (sender, e) => {
  Console.WriteLine($"✗ disconnected: {e}");
};

await socket.ConnectAsync();
await Task.Delay(-1);`;

    case "php":
      return `<?php
require __DIR__ . '/vendor/autoload.php';

use ElephantIO\\Client;
use ElephantIO\\Engine\\SocketIO\\Version4X;

$client = new Client(new Version4X('${url}'${token ? `, ['headers' => ['Authorization' => 'Bearer ${token}']]` : ""}));

$client->initialize();
echo "✓ connected\\n";

$client->emit('${event}', ${payload});

$data = $client->read();
echo "← received: " . json_encode($data) . "\\n";

$client->close();`;

    case "ruby":
      return `require 'socket.io-client-simple'

socket = SocketIO::Client::Simple.connect('${url}'${token ? `, headers: { 'Authorization' => 'Bearer ${token}' }` : ""})

socket.on :connect do
  puts "✓ connected"
  socket.emit '${event}', ${payload}
end

socket.on :disconnect do
  puts "✗ disconnected"
end

sleep`;

    case "dart":
      return `import 'package:socket_io_client/socket_io_client.dart' as IO;

void main() {
  IO.Socket socket = IO.io(
    '${url}',
    IO.OptionBuilder()
      .setTransports(['websocket'])${token ? `\n      .setAuth({'token': '${token}'})` : ""}
      .build(),
  );

  socket.onConnect((_) {
    print('✓ connected: \${socket.id}');
    socket.emit('${event}', ${payload});
  });

  socket.onDisconnect((_) => print('✗ disconnected'));
}`;

    case "wscat":
      return `# Install
npm install -g wscat

# Connect${token ? `\n# Token: pass via query param or custom header` : ""}
wscat -c "${url.replace("http", "ws")}"

# Paste this frame once connected:
42["${event}",${payload}]

# Socket.IO frame format:
# 4 = Engine.IO message, 2 = Socket.IO event`;
  }
}

// ── Sub-components ────────────────────────────────────

/**
 * Brand-color dot for language tabs.
 */
function LangDot({ color }: { color: string }) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/20"
      style={{ backgroundColor: color }}
    />
  );
}

/**
 * A multi-language code generation modal component for Socket.IO client examples.
 *
 * Provides ready-to-run code snippets in 10+ languages (TypeScript, JavaScript, Python, Go, Java, C#, PHP, Ruby, Dart, wscat).
 * Users can switch between languages via tabs, star favorites for quick access, copy generated code, and view installation hints.
 *
 * Layout:
 * - Modal uses `h-[80vh] flex flex-col` with absolute positioning for the Monaco editor
 * - Static sections (header, tabs, bar, footer) have `shrink-0` to preserve size
 * - Editor container uses `flex-1 min-h-0 relative` with absolute child for proper height calculation
 * - Supports keyboard escape to close and backdrop click to dismiss
 *
 * Features:
 * - Syntax-highlighted code generation with configurable token auth injection
 * - Language-specific tab styling with colored dots and badges
 * - Star/favorite system to quickly access preferred languages
 * - Copy-to-clipboard for both generated code and install commands
 * - Format button triggers Monaco's built-in document formatting
 * - Responsive tab strip with horizontal scrolling on overflow
 * - Footer with language-specific install hints
 *
 * @component
 * @example
 * ```tsx
 * const [codeGenOpen, setCodeGenOpen] = useState(false);
 * <CodeGenPanel
 *   open={codeGenOpen}
 *   onClose={() => setCodeGenOpen(false)}
 *   event={selectedEvent}
 *   url="http://localhost:3000"
 *   token="Bearer abc123"
 *   payload='{"message": "hello"}'
 * />
 * ```
 */
export default function CodeGenPanel({
  open,
  onClose,
  event,
  url,
  token,
  payload,
}: CodeGenPanelProps) {
  // ── State ──────────────────────────────────────────

  const [lang, setLang] = useState<CodeLang>("typescript");
  const [copied, setCopied] = useState(false);
  const [starred, setStarred] = useState<Set<CodeLang>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    Parameters<import("@monaco-editor/react").OnMount>[0] | null
  >(null);

  // ── Derived ───────────────────────────────────────

  const code = generateCode(lang, url, token, event.event, payload);
  const conf = CODE_LANGS[lang];

  // ── Side effects ──────────────────────────────────

  /** Close on Escape key. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** Lock body scroll while modal is open. */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ── Handlers ─────────────────────────────────────

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function toggleStar(id: CodeLang) {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!open) return null;

  // ── Render ────────────────────────────────────────

  return (
    // ── Backdrop ──
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop — keyboard dismiss handled via Escape on the dialog
    // biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop — keyboard dismiss handled via Escape on the dialog
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={handleBackdrop}
    >
      {/*
        ── Modal ──
        h-[80vh]        → concrete pixel height for the whole dialog
        flex flex-col   → children stack vertically
        overflow-hidden → clips rounded corners
      */}
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl h-[80vh] flex flex-col rounded-xl border border-zinc-600/40 bg-zinc-950 shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* ── Header — shrink-0 ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-700/50 bg-linear-to-b from-zinc-900/80 to-zinc-950/40 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-zinc-700 to-zinc-800 border border-zinc-600/60 flex items-center justify-center shrink-0 shadow-sm">
            <Code2 className="w-4 h-4 text-blue-300" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold text-zinc-50 leading-tight tracking-tight">
              Code Generation
            </span>
          </div>

          {/* Active lang badge */}
          <Badge
            variant="outline"
            className={`text-[10px] gap-1.5 px-2 h-6 border shrink-0 font-semibold shadow-sm ${conf.color}`}
          >
            <LangDot color={conf.dot} />
            {conf.label}
          </Badge>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-300 hover:bg-red-500/10 hover:border hover:border-red-500/30 transition-all border border-transparent shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Starred row — shrink-0, only when starred ── */}
        {starred.size > 0 && (
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 bg-yellow-500/5 border-b border-yellow-500/10 shrink-0">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
            <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider shrink-0">
              Favorites
            </span>
            <div className="flex gap-1.5">
              {LANG_ORDER.filter((id) => starred.has(id)).map((id) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setLang(id)}
                  className={`text-[11px] font-bold px-2 py-1 rounded border transition-all ${
                    lang === id
                      ? CODE_LANGS[id].color
                      : "border-zinc-700/50 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-600"
                  }`}
                >
                  {CODE_LANGS[id].badge}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Language tab strip — shrink-0 ── */}
        <div className="flex gap-1 px-4 pt-2.5 pb-2 overflow-x-auto shrink-0 scrollbar-none bg-zinc-950/40">
          {LANG_ORDER.map((id) => {
            const c = CODE_LANGS[id];
            const isActive = lang === id;
            const isStarred = starred.has(id);

            return (
              <div key={id} className="relative shrink-0 group/tab">
                <button
                  type="button"
                  onClick={() => setLang(id)}
                  className={`flex items-center gap-1.5 pl-3 pr-8 py-1.5 rounded-md text-[11px] font-semibold border transition-all duration-150 ${
                    isActive
                      ? c.color + " shadow-md"
                      : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-700/50"
                  }`}
                >
                  <LangDot color={c.dot} />
                  {c.label}
                </button>

                {/* Star toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(id);
                  }}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-all ${
                    isStarred
                      ? "opacity-100 text-yellow-400"
                      : "opacity-0 group-hover/tab:opacity-100 text-zinc-600 hover:text-yellow-400"
                  }`}
                >
                  {isStarred ? (
                    <Star className="w-3 h-3 fill-yellow-400" />
                  ) : (
                    <StarOff className="w-3 h-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Active lang bar + copy — shrink-0 ── */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-b border-zinc-700/50 bg-gradient-to-r from-zinc-900/60 to-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <LangDot color={conf.dot} />
            <span
              className={`text-[11px] font-bold tracking-tight ${conf.color.split(" ")[0]}`}
            >
              {conf.label}
            </span>
            {starred.has(lang) && (
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
            )}
            <span className="text-zinc-700 text-[11px]">·</span>
            <span className="text-[11px] text-zinc-500 font-mono font-semibold truncate">
              {event.event}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format — triggers Monaco's built-in formatDocument action */}
            <button
              type="button"
              onClick={() =>
                editorRef.current
                  ?.getAction("editor.action.formatDocument")
                  ?.run()
              }
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md border border-zinc-700/50 text-zinc-500 hover:text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
              title="Format code (Alt+Shift+F)"
            >
              <Braces className="w-3.5 h-3.5" />
              Format
            </button>

            {/* Copy code */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md border transition-all ${
                copied
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : "border-zinc-700/50 text-zinc-500 hover:text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy code
                </>
              )}
            </button>
          </div>
        </div>

        {/*
          ── Editor area ──
          flex-1 min-h-0 → takes all remaining modal height, allows shrinking
          relative        → positioning context for the absolute child
        */}
        <div className="flex-1 min-h-0 relative">
          {/*
            absolute inset-0 → concrete pixel dimensions for Monaco
            Monaco height="100%" now has a real parent size to measure
          */}
          <div className="absolute inset-0 bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={conf.monacoId}
              value={code}
              theme="vs-dark"
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              options={CODEGEN_EDITOR_OPTIONS}
            />
          </div>
        </div>

        {/* ── Footer — install hint — shrink-0 ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-700/50 bg-gradient-to-b from-zinc-900/40 to-zinc-950/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Terminal className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <code className="text-[11px] text-zinc-500 font-mono font-medium truncate">
              {INSTALL_HINT[lang]}
            </code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(INSTALL_HINT[lang])}
            type="button"
            className="shrink-0 flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors px-2 py-1 rounded-md border border-transparent hover:border-zinc-700/50 ml-3"
          >
            <Copy className="w-3 h-3" />
            copy
          </button>
        </div>
      </div>
    </div>
  );
}
