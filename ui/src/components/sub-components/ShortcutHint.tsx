/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { Keyboard } from "lucide-react";

// ── Component ─────────────────────────────────────────

/**
 * Keyboard shortcut hint badge rendered below the Emit button.
 *
 * Reminds the user that `Ctrl+Enter` (or `Cmd+Enter` on macOS)
 * can be used to emit the current event without clicking the button.
 *
 * Rendered only when the socket is connected and the selected
 * event is of type `emit`.
 */
export default function ShortcutHint() {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <Keyboard className="w-3 h-3 text-zinc-700" />
      <span className="text-[10px] text-zinc-700 font-mono">
        <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500">
          Ctrl
        </kbd>
        {" + "}
        <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500">
          ↵
        </kbd>
        {" to emit"}
      </span>
    </div>
  );
}
