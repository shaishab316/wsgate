/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { useState } from "react";
import {
  Code2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Terminal,
  Star,
  StarOff,
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
  /** Short badge label shown on the tab and collapsed badge. */
  badge: string;
  /** Tailwind classes for the active tab state. */
  color: string;
  /** Hex color used for the brand dot indicator. */
  dot: string;
}

// ── Props ─────────────────────────────────────────────

/**
 * Props for the CodeGenPanel component.
 * Exported so consumers can reference the type if needed.
 */
export interface CodeGenPanelProps {
  /** Currently selected WsEvent — used for the event name. */
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
 * Read-only Monaco editor options used for all generated snippets.
 */
const CODEGEN_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 12,
  fontFamily: "JetBrains Mono, Fira Code, monospace",
  lineNumbers: "on" as const,
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  folding: true,
  renderLineHighlight: "line" as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "hidden" as const,
    verticalScrollbarSize: 6,
  },
  padding: { top: 12, bottom: 12 },
  readOnly: true,
  contextmenu: false,
  glyphMargin: false,
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

# Listen for response
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
      return `# ── Install ──────────────────────────────
npm install -g wscat

# ── Connect ──────────────────────────────${token ? `\n# Token: pass via query param or custom header` : ""}
wscat -c "${url.replace("http", "ws")}"

# ── Once connected, paste this frame ─────
42["${event}",${payload}]

# ── Tip: Socket.IO frame format ──────────
# 4  = Engine.IO message
# 2  = Socket.IO event
# ["<eventName>", <payload>]`;
  }
}

// ── Sub-components ────────────────────────────────────

/**
 * Small brand-color dot rendered in each language tab.
 *
 * @param color - Hex color string matching the language brand.
 */
function LangDot({ color }: { color: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

// ─────────────────────────────────────────────────────

/**
 * Horizontally scrollable language tab strip.
 *
 * Each tab shows a brand dot + label. Hovering reveals a star button
 * to mark the language as a favorite.
 *
 * @param active   - Currently selected language ID.
 * @param starred  - Set of starred/favorite language IDs.
 * @param onSelect - Called when a language tab is clicked.
 * @param onStar   - Toggles the star on a given language.
 */
function LangTabs({
  active,
  starred,
  onSelect,
  onStar,
}: {
  active: CodeLang;
  starred: Set<CodeLang>;
  onSelect: (lang: CodeLang) => void;
  onStar: (lang: CodeLang) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 px-3 pt-3 scrollbar-none">
      {LANG_ORDER.map((id) => {
        const conf = CODE_LANGS[id];
        const isActive = active === id;
        const isStarred = starred.has(id);

        return (
          <div key={id} className="relative shrink-0 group/tab">
            <button
              onClick={() => onSelect(id)}
              className={`flex items-center gap-1.5 pl-2.5 pr-7 py-1.5 rounded-lg text-[10px] font-semibold border transition-all duration-150 ${
                isActive
                  ? conf.color
                  : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700"
              }`}
            >
              <LangDot color={conf.dot} />
              {conf.label}
            </button>

            {/* Star toggle — revealed on hover, always visible when starred */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStar(id);
              }}
              title={isStarred ? "Unstar" : "Star"}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-all duration-150 ${
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
  );
}

// ── Component ─────────────────────────────────────────

/**
 * Multi-language code generation panel (Postman-style).
 *
 * Generates ready-to-run Socket.IO client snippets for 10 languages:
 * TypeScript, JavaScript, Python, Go, Java, C#, PHP, Ruby, Dart, wscat.
 *
 * Features:
 * - Collapsible accordion with active-lang badge when closed
 * - Scrollable language tab strip with brand-color dot indicators
 * - Per-tab star/favorite toggle with quick-access favorites row
 * - Live code regeneration as payload / url / token changes
 * - Dynamic editor height based on line count (capped 160–320px)
 * - Read-only Monaco editor with syntax highlighting per language
 * - Copy code + copy install hint buttons
 * - Install command footer per language
 */
export default function CodeGenPanel({
  event,
  url,
  token,
  payload,
}: CodeGenPanelProps) {
  // ── State ──────────────────────────────────────────

  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<CodeLang>("typescript");
  const [copied, setCopied] = useState(false);
  const [starred, setStarred] = useState<Set<CodeLang>>(new Set());

  // ── Derived ───────────────────────────────────────

  /** Live-generated code — updates every time payload / lang / url / token changes. */
  const code = generateCode(lang, url, token, event.event, payload);
  const conf = CODE_LANGS[lang];

  /** Dynamic editor height — grows with line count, capped between 160–320px. */
  const editorH = `${Math.min(Math.max(code.split("\n").length * 19 + 24, 160), 320)}px`;

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

  // ── Render ────────────────────────────────────────

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden shrink-0 ${
        open
          ? "border-zinc-700 bg-zinc-900/30"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* ── Toggle header ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 group"
      >
        <div className="w-7 h-7 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center transition-colors shrink-0">
          <Code2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
        </div>

        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">
            Code Generation
          </span>
          <span className="text-[10px] text-zinc-600">
            10 languages — TS · JS · Python · Go · Java · C# · PHP · Ruby · Dart
            · wscat
          </span>
        </div>

        {/* Active lang badge — visible when collapsed */}
        {!open && (
          <Badge
            variant="outline"
            className={`text-[9px] shrink-0 gap-1 px-1.5 h-5 border ${conf.color}`}
          >
            <LangDot color={conf.dot} />
            {conf.badge}
          </Badge>
        )}

        {/* Starred count pill — visible when collapsed */}
        {!open && starred.size > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-yellow-500 shrink-0">
            <Star className="w-2.5 h-2.5 fill-yellow-500" />
            {starred.size}
          </span>
        )}

        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        )}
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div className="flex flex-col border-t border-zinc-800">
          {/* Starred quick-access row — shown only when at least one lang is starred */}
          {starred.size > 0 && (
            <div className="flex items-center gap-2 px-3 pt-2.5">
              <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 shrink-0" />
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest shrink-0">
                Favorites
              </span>
              <div className="flex gap-1 flex-wrap">
                {LANG_ORDER.filter((id) => starred.has(id)).map((id) => (
                  <button
                    key={id}
                    onClick={() => setLang(id)}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all duration-150 ${
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

          {/* Language tab strip */}
          <LangTabs
            active={lang}
            starred={starred}
            onSelect={setLang}
            onStar={toggleStar}
          />

          {/* Active language bar — lang name + copy button */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-b border-zinc-800 bg-zinc-900/40">
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
            </div>

            {/* Copy code button */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
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

          {/* Read-only syntax-highlighted Monaco code editor */}
          <div className="mx-3 mt-3 mb-2 rounded-lg overflow-hidden border border-zinc-800 bg-[#1e1e1e]">
            <Editor
              height={editorH}
              language={conf.monacoId}
              value={code}
              theme="vs-dark"
              options={CODEGEN_EDITOR_OPTIONS}
            />
          </div>

          {/* Install hint footer with copy button */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="w-3 h-3 text-zinc-700 shrink-0" />
              <p className="text-[10px] text-zinc-600 font-mono truncate">
                {INSTALL_HINT[lang]}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(INSTALL_HINT[lang])}
              className="shrink-0 text-[9px] text-zinc-700 hover:text-zinc-400 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800 ml-2"
            >
              copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
