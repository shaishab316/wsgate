import type { SocketStatus } from "@/hooks/useSocket";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Braces,
  Hash,
  List,
  Loader2,
  Radio,
  Send,
  ToggleLeft,
  Type,
  Wifi,
  WifiOff,
} from "lucide-react";

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

export const STATUS_CONFIG: Record<
  SocketStatus,
  {
    badgeClass: string;
    dotClass: string;
    label: string;
    icon: React.ReactNode;
    pulse: boolean;
  }
> = {
  disconnected: {
    badgeClass: "border-zinc-700 text-zinc-500 bg-zinc-900/60",
    dotClass: "bg-zinc-600",
    label: "Disconnected",
    icon: <WifiOff className="w-3 h-3" />,
    pulse: false,
  },
  connecting: {
    badgeClass: "border-yellow-500/50 text-yellow-400 bg-yellow-500/5",
    dotClass: "bg-yellow-400",
    label: "Connecting",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    pulse: true,
  },
  connected: {
    badgeClass: "border-emerald-500/50 text-emerald-400 bg-emerald-500/5",
    dotClass: "bg-emerald-400",
    label: "Connected",
    icon: <Wifi className="w-3 h-3" />,
    pulse: true,
  },
  error: {
    badgeClass: "border-red-500/50 text-red-400 bg-red-500/5",
    dotClass: "bg-red-400",
    label: "Error",
    icon: <AlertTriangle className="w-3 h-3" />,
    pulse: false,
  },
};

/**
 * Visual configuration for each event type badge.
 */
export const TYPE_CONFIG: Record<
  "emit" | "subscribe",
  { className: string; icon: React.ReactNode; label: string }
> = {
  emit: {
    className: "border-blue-500/40 text-blue-400 bg-blue-500/5",
    icon: <Send className="w-2.5 h-2.5" />,
    label: "emit",
  },
  subscribe: {
    className: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
    icon: <Radio className="w-2.5 h-2.5" />,
    label: "sub",
  },
};

/**
 * Color tokens for namespace filter pills.
 * The root namespace `'/'` always maps to the first (zinc) entry.
 * All other namespaces are assigned by their sorted position.
 *
 * Each entry exposes:
 * - `dot`    — filled dot indicator inside the pill
 * - `idle`   — unselected pill appearance
 * - `active` — selected pill appearance
 */
export const NAMESPACE_PALETTE = [
  {
    dot: "bg-zinc-500",
    idle: "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
    active: "border-zinc-500 text-zinc-200 bg-zinc-800",
  },
  {
    dot: "bg-blue-400",
    idle: "border-blue-500/25 text-blue-500/80 hover:border-blue-500/50 hover:text-blue-400",
    active: "border-blue-400/60 text-blue-300 bg-blue-500/10",
  },
  {
    dot: "bg-purple-400",
    idle: "border-purple-500/25 text-purple-500/80 hover:border-purple-500/50 hover:text-purple-400",
    active: "border-purple-400/60 text-purple-300 bg-purple-500/10",
  },
  {
    dot: "bg-amber-400",
    idle: "border-amber-500/25 text-amber-500/80 hover:border-amber-500/50 hover:text-amber-400",
    active: "border-amber-400/60 text-amber-300 bg-amber-500/10",
  },
  {
    dot: "bg-teal-400",
    idle: "border-teal-500/25 text-teal-500/80 hover:border-teal-500/50 hover:text-teal-400",
    active: "border-teal-400/60 text-teal-300 bg-teal-500/10",
  },
  {
    dot: "bg-pink-400",
    idle: "border-pink-500/25 text-pink-500/80 hover:border-pink-500/50 hover:text-pink-400",
    active: "border-pink-400/60 text-pink-300 bg-pink-500/10",
  },
];

export const DIRECTION_CONFIG = {
  all: {
    icon: <ArrowUpDown className="w-3 h-3" />,
    label: "All",
    activeClass: "bg-zinc-700 text-zinc-100 border-zinc-600",
  },
  out: {
    icon: <ArrowUp className="w-3 h-3" />,
    label: "Out",
    activeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  in: {
    icon: <ArrowDown className="w-3 h-3" />,
    label: "In",
    activeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
} as const;

export const LOG_BUFFER_LIMIT = 200;
