/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * @packageDocumentation
 */

import { Keyboard } from "lucide-react";

/**
 * Displays a visual hint for a keyboard shortcut.
 *
 * Shows a keyboard icon alongside text indicating that pressing
 * Ctrl + Enter will emit an action.
 *
 * @component
 * @returns {React.ReactElement} A flex container displaying the shortcut hint with styled keyboard keys.
 *
 * @example
 * ```tsx
 * <ShortcutHint />
 * ```
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
