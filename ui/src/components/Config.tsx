import { Braces, Hash, List, ToggleLeft, Type } from "lucide-react";

export const HISTORY_LIMIT = 8;

export const BASE_EDITOR_OPTIONS = {
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
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "hidden" as const,
    verticalScrollbarSize: 6,
  },
  padding: { top: 12, bottom: 12 },
};

export const TYPE_ICON: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  string: {
    icon: <Type className="w-2.5 h-2.5" />,
    color: "text-amber-400  border-amber-500/30  bg-amber-500/5",
  },
  number: {
    icon: <Hash className="w-2.5 h-2.5" />,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  },
  integer: {
    icon: <Hash className="w-2.5 h-2.5" />,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  },
  boolean: {
    icon: <ToggleLeft className="w-2.5 h-2.5" />,
    color: "text-pink-400   border-pink-500/30   bg-pink-500/5",
  },
  enum: {
    icon: <List className="w-2.5 h-2.5" />,
    color: "text-cyan-400   border-cyan-500/30   bg-cyan-500/5",
  },
  default: {
    icon: <Braces className="w-2.5 h-2.5" />,
    color: "text-zinc-400  border-zinc-600      bg-zinc-800",
  },
};
