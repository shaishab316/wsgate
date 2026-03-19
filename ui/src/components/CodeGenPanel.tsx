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
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { Badge } from "@/components/ui/badge";
import type { SelectedEvent } from "@/store/wsgate.store";

// ── Types ─────────────────────────────────────────────

/**
 * Supported code generation target languages.
 */
export type CodeLang = "typescript" | "javascript" | "python" | "wscat";

/**
 * Visual and Monaco language config per codegen tab.
 */
interface CodeLangConfig {
  label: string;
  monacoId: string;
  icon: string;
  color: string;
}

// ── Constants ─────────────────────────────────────────

/**
 * Display and Monaco language config for each supported codegen tab.
 */
const CODE_LANGS: Record<CodeLang, CodeLangConfig> = {
  typescript: {
    label: "TypeScript",
    monacoId: "typescript",
    icon: "TS",
    color: "text-blue-400   bg-blue-500/10   border-blue-500/30",
  },
  javascript: {
    label: "JavaScript",
    monacoId: "javascript",
    icon: "JS",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  },
  python: {
    label: "Python",
    monacoId: "python",
    icon: "PY",
    color: "text-green-400  bg-green-500/10  border-green-500/30",
  },
  wscat: {
    label: "wscat CLI",
    monacoId: "shell",
    icon: "$_",
    color: "text-zinc-300   bg-zinc-800      border-zinc-600",
  },
};

/**
 * Install command hint shown in the panel footer per language.
 */
const INSTALL_HINT: Record<CodeLang, string> = {
  typescript: "pnpm add socket.io-client",
  javascript: "pnpm add socket.io-client",
  python: "pip install python-socketio",
  wscat: "npm install -g wscat",
};

// ── Base editor options ───────────────────────────────

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
  folding: false,
  renderLineHighlight: "none" as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: { vertical: "hidden" as const, horizontal: "hidden" as const },
  padding: { top: 10, bottom: 10 },
  readOnly: true,
  contextmenu: false,
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

socket.on("disconnect", () => {
  console.log("✗ disconnected");
});`;

    case "javascript":
      return `const { io } = require("socket.io-client");

const socket = io("${url}"${authTs});

socket.on("connect", () => {
  console.log("✓ connected:", socket.id);

  socket.emit("${event}", ${payload});
});

socket.on("disconnect", () => {
  console.log("✗ disconnected");
});`;

    case "python":
      return `import socketio

sio = socketio.SimpleClient()

sio.connect("${url}"${authPython})
print(f"✓ connected: {sio.sid}")

sio.emit("${event}", ${payload})

# listen for response
event, data = sio.receive()
print(f"← {event}:", data)

sio.disconnect()`;

    case "wscat":
      return `# Install wscat
npm install -g wscat

# Connect${token ? `\n# Note: pass token via query/auth as needed` : ""}
wscat -c "${url.replace("http", "ws")}"

# Once connected, paste this payload:
42["${event}",${payload}]`;
  }
}

// ── Props ─────────────────────────────────────────────

interface CodeGenPanelProps {
  /** Currently selected WsEvent — used for event name. */
  event: SelectedEvent;
  /** Socket.IO server URL from store. */
  url: string;
  /** Optional Bearer token from store. */
  token: string;
  /** Current JSON payload string from the editor. */
  payload: string;
}

// ── Component ─────────────────────────────────────────

/**
 * Multi-language code generation panel (Postman-style).
 *
 * Generates ready-to-run Socket.IO client snippets for TypeScript,
 * JavaScript, Python, and wscat CLI — derived from the current
 * event name, server URL, token, and JSON payload in the editor.
 *
 * Rendered as a collapsible accordion below the Monaco editor.
 * All code is displayed in a read-only Monaco editor with syntax highlighting.
 * Install hint is shown in the footer per language.
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

  // ── Derived ───────────────────────────────────────

  const code = generateCode(lang, url, token, event.event, payload);

  // ── Handlers ─────────────────────────────────────

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── Render ────────────────────────────────────────

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        open
          ? "border-zinc-700 bg-zinc-900/40"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* ── Toggle header ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 group"
      >
        <div className="w-6 h-6 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center transition-colors shrink-0">
          <Code2 className="w-3.5 h-3.5 text-zinc-400" />
        </div>

        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">
            Code Generation
          </span>
          <span className="text-[10px] text-zinc-600">
            TypeScript · JavaScript · Python · wscat
          </span>
        </div>

        {/* Active lang badge — visible when collapsed */}
        {!open && (
          <Badge
            variant="outline"
            className={`text-[9px] shrink-0 px-1.5 h-4 border ${CODE_LANGS[lang].color}`}
          >
            {CODE_LANGS[lang].icon}
          </Badge>
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
          {/* Language tabs + copy button */}
          <div className="flex items-center gap-1 px-3 pt-3 pb-2 flex-wrap">
            {(Object.entries(CODE_LANGS) as [CodeLang, CodeLangConfig][]).map(
              ([id, conf]) => (
                <button
                  key={id}
                  onClick={() => setLang(id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all duration-150 ${
                    lang === id
                      ? conf.color
                      : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center ${
                      lang === id ? "" : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {conf.icon}
                  </span>
                  {conf.label}
                </button>
              ),
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Copy code button */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all duration-150 ${
                copied
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
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

          {/* Read-only syntax-highlighted code snippet */}
          <div className="mx-3 mb-2 rounded-lg overflow-hidden border border-zinc-800 bg-[#1e1e1e]">
            <Editor
              height="220px"
              language={CODE_LANGS[lang].monacoId}
              value={code}
              theme="vs-dark"
              options={CODEGEN_EDITOR_OPTIONS}
            />
          </div>

          {/* Install hint footer */}
          <div className="flex items-center gap-2 px-3 pb-3">
            <Terminal className="w-3 h-3 text-zinc-700 shrink-0" />
            <p className="text-[10px] text-zinc-700 font-mono">
              {INSTALL_HINT[lang]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
