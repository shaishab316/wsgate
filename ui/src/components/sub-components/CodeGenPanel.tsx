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
  Code2,
  Copy,
  Check,
  Terminal,
  Star,
  StarOff,
  X,
  Braces,
} from "lucide-react";
import Editor from "@monaco-editor/react";
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
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

// ── Component ─────────────────────────────────────────

/**
 * Multi-language code generation modal (Postman-style).
 *
 * Key layout fix:
 * - Modal is `h-[80vh]` with `flex flex-col`
 * - Static sections (header, tabs, bar, footer) are `shrink-0`
 * - Editor wrapper is `flex-1 min-h-0 relative`
 * - Inner div is `absolute inset-0` — gives Monaco a concrete pixel height
 *
 * This is the same pattern used in EventPanel and is the only reliable
 * way to give Monaco `height="100%"` inside a flex container.
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
        className="relative w-full max-w-3xl h-[80vh] flex flex-col rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/70 overflow-hidden"
      >
        {/* ── Header — shrink-0 ── */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-800 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-zinc-100 leading-none">
              Code Generation
            </span>
          </div>

          {/* Active lang badge */}
          <Badge
            variant="outline"
            className={`text-[9px] gap-1 px-1.5 h-5 border shrink-0 ${conf.color}`}
          >
            <LangDot color={conf.dot} />
            {conf.label}
          </Badge>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 transition-all shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Starred row — shrink-0, only when starred ── */}
        {starred.size > 0 && (
          <div className="flex items-center gap-2 px-3 pt-2 shrink-0">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 shrink-0" />
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest shrink-0">
              Favorites
            </span>
            <div className="flex gap-1">
              {LANG_ORDER.filter((id) => starred.has(id)).map((id) => (
                <button
                  key={id}
                  onClick={() => setLang(id)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                    lang === id
                      ? CODE_LANGS[id].color
                      : "border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {CODE_LANGS[id].badge}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Language tab strip — shrink-0 ── */}
        <div className="flex gap-0.5 px-3 pt-2 pb-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {LANG_ORDER.map((id) => {
            const c = CODE_LANGS[id];
            const isActive = lang === id;
            const isStarred = starred.has(id);

            return (
              <div key={id} className="relative shrink-0 group/tab">
                <button
                  onClick={() => setLang(id)}
                  className={`flex items-center gap-1.5 pl-2.5 pr-7 py-1.5 rounded-lg text-[10px] font-semibold border transition-all duration-150 ${
                    isActive
                      ? c.color
                      : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <LangDot color={c.dot} />
                  {c.label}
                </button>

                {/* Star toggle */}
                <button
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
                    <Star className="w-2.5 h-2.5 fill-yellow-400" />
                  ) : (
                    <StarOff className="w-2.5 h-2.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Active lang bar + copy — shrink-0 ── */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <LangDot color={conf.dot} />
            <span
              className={`text-[10px] font-semibold ${conf.color.split(" ")[0]}`}
            >
              {conf.label}
            </span>
            {starred.has(lang) && (
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            )}
            <span className="text-zinc-700 text-[10px]">·</span>
            <span className="text-[10px] text-zinc-600 font-mono">
              {event.event}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Format — triggers Monaco's built-in formatDocument action */}
            <button
              onClick={() =>
                editorRef.current
                  ?.getAction("editor.action.formatDocument")
                  ?.run()
              }
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-500 transition-all"
              title="Format code (Alt+Shift+F)"
            >
              <Braces className="w-3 h-3" />
              Format
            </button>

            {/* Copy code */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                copied
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-500"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
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
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="w-3 h-3 text-zinc-600 shrink-0" />
            <code className="text-[10px] text-zinc-500 font-mono truncate">
              {INSTALL_HINT[lang]}
            </code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(INSTALL_HINT[lang])}
            className="shrink-0 flex items-center gap-1 text-[9px] text-zinc-600 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800 ml-2"
          >
            <Copy className="w-2.5 h-2.5" />
            copy
          </button>
        </div>
      </div>
    </div>
  );
}
