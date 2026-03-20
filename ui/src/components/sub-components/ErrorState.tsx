import { Layers, RefreshCw, Server, ServerCrash, X, Zap } from "lucide-react";
import { useState } from "react";

/**
 * Interactive error state shown when `{url}/wsgate/events.json` fails.
 *
 * Key design decision — this component does NOT write to the Zustand store.
 * Editing the URL here only affects the events fetch, never the socket
 * connection string. The edited URL is passed directly to `onRetry(url)`
 * so the parent can re-fetch without polluting global state.
 *
 * @param url     - The URL that failed (used as initial input value).
 * @param onRetry - Called with the (possibly edited) URL to re-fetch.
 */
export function ErrorState({
  url,
  onRetry,
}: {
  url: string;
  onRetry: (url: string) => void;
}) {
  // ── Local state ─────────────────────────────────────

  const [editUrl, setEditUrl] = useState<string>(url);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  /** True when the user has changed the URL from its original value. */
  const isDirty = editUrl !== url;

  // ── Handlers ────────────────────────────────────────

  /**
   * Triggers the retry with a brief spinner delay for visual feedback.
   * Passes `editUrl` directly — never writes to the Zustand store.
   */
  function handleRetry() {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onRetry(editUrl);
    }, 600);
  }

  /** Resets the input back to the original failed URL. */
  function handleReset() {
    setEditUrl(url);
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 gap-6 text-center">
      {/* Icon + pulse ring */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center">
          <ServerCrash className="w-8 h-8 text-red-400" />
        </div>
        <div className="absolute inset-0 rounded-2xl border border-red-500/20 animate-pulse" />
      </div>

      {/* Title + hint */}
      <div className="flex flex-col gap-2 max-w-sm">
        <p className="text-base font-bold text-zinc-100">Connection Failed</p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          We couldn't reach your NestJS server. Verify the URL below and try
          again.
        </p>
      </div>

      {/* Editable server URL — does NOT affect socket connection */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        <label className="text-[10px] text-zinc-600 uppercase tracking-widest text-left px-1 font-semibold">
          Server URL
        </label>

        <div
          className={`flex items-center gap-2 w-full bg-zinc-900 border rounded-lg px-3 h-10 transition-all duration-200 ${
            focused
              ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
              : isDirty
                ? "border-yellow-500/40"
                : "border-zinc-700 hover:border-zinc-600"
          }`}
        >
          <Server
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              focused ? "text-blue-400" : "text-zinc-600"
            }`}
          />
          <input
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleRetry()}
            placeholder="http://localhost:3000"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent text-xs font-mono text-zinc-100 focus:outline-none placeholder:text-zinc-600"
          />
          {/* Reset to original URL */}
          {isDirty && (
            <button
              onClick={handleReset}
              title="Reset to original"
              className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-800/50 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick checklist — helps user self-diagnose */}
      <div className="w-full max-w-sm bg-linear-to-br from-zinc-900/60 to-zinc-900/30 border border-zinc-800/60 rounded-lg px-4 py-3 flex flex-col gap-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
          Troubleshooting
        </p>
        {[
          {
            icon: <Zap className="w-3 h-3" />,
            text: "NestJS server is running",
          },
          {
            icon: <Layers className="w-3 h-3" />,
            text: "WsgateModule is imported",
          },
          {
            icon: <Server className="w-3 h-3" />,
            text: "Port & URL are correct",
          },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-2 group">
            <span className="text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors">
              {icon}
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
              {text}
            </span>
          </div>
        ))}
      </div>

      {/* Retry — turns blue when URL is edited */}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className={`w-full max-w-sm flex items-center justify-center gap-2 text-xs font-semibold rounded-lg px-4 py-3 border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          isDirty
            ? "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
            : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100"
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
        {retrying ? "Retrying..." : isDirty ? "Save & Retry" : "Retry"}
      </button>
    </div>
  );
}
