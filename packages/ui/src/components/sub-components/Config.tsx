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

/**
 * Maximum number of items to keep in the event history.
 * When the history exceeds this limit, oldest events are removed.
 * @type {number}
 */
export const HISTORY_LIMIT: number = 8;

/**
 * Default configuration options for Monaco Editor instances.
 * Provides a minimal, cleaned-up editor UI optimized for displaying JSON payloads
 * and event data with focus on content rather than editor chrome.
 *
 * @type {object}
 * @property {object} minimap - Disable minimap overview
 * @property {number} fontSize - Editor font size in pixels
 * @property {string} fontFamily - Monospace font stack for code
 * @property {string} lineNumbers - Hide line numbers for cleaner look
 * @property {boolean} scrollBeyondLastLine - Prevent scrolling past content
 * @property {string} wordWrap - Enable word wrapping for long lines
 * @property {boolean} folding - Disable code folding UI
 * @property {string} renderLineHighlight - Don't highlight current line
 * @property {number} overviewRulerLanes - Hide overview ruler
 * @property {boolean} hideCursorInOverviewRuler - Hide cursor in ruler
 * @property {object} scrollbar - Configure scrollbar appearance
 * @property {object} padding - Add top/bottom padding around content
 *
 * @example
 * // Use in Monaco Editor component
 * <MonacoEditor options={BASE_EDITOR_OPTIONS} />
 */
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

/**
 * Visual configurations for JSON schema type indicators.
 * Maps TypeScript/JSON schema types to their corresponding icons and color classes.
 * Used throughout the UI to visually distinguish different data types in event payloads.
 *
 * @type {Record<string, {icon: React.ReactNode, color: string}>}
 * @property {object} string - Amber colored indicator for string types
 * @property {object} number - Purple colored indicator for numeric types
 * @property {object} integer - Purple colored indicator for integer types
 * @property {object} boolean - Pink colored indicator for boolean types
 * @property {object} enum - Cyan colored indicator for enumerated types
 * @property {object} default - Zinc/gray fallback for unknown types
 *
 * Each entry contains:
 * - `icon`: Lucide React icon component to display
 * - `color`: Tailwind CSS classes for badge styling (text, border, background)
 *
 * @example
 * // Display type badge in component
 * const typeConfig = TYPE_ICON["string"];
 * <Badge className={typeConfig.color}>{typeConfig.icon}</Badge>
 */
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

/**
 * WebSocket connection status visual configurations.
 * Defines the appearance and behavior for each possible socket connection state.
 * Used to provide users with clear visual feedback about the connection state.
 *
 * @type {Record<SocketStatus, object>}
 * @property {string} badgeClass - Tailwind CSS classes for the status badge
 * @property {string} dotClass - Tailwind CSS classes for the status indicator dot
 * @property {string} label - Human-readable label for the status
 * @property {React.ReactNode} icon - Lucide React icon to display
 * @property {boolean} pulse - Whether to add a pulsing animation effect
 *
 * Status states:
 * - `disconnected`: Not connected to WebSocket (grey, static)
 * - `connecting`: Connection in progress (yellow, pulsing)
 * - `connected`: Successfully connected (green, pulsing)
 * - `error`: Connection failed or broken (red, static)
 *
 * @example
 * // Display connection status in navbar
 * const config = STATUS_CONFIG[socketStatus];
 * <Badge className={config.badgeClass}>{config.icon} {config.label}</Badge>
 */
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
 * Visual configuration for WebSocket event type badges.
 * Distinguishes between emitted events (outgoing) and subscribed events (incoming).
 *
 * @type {Record<"emit" | "subscribe", object>}
 * @property {object} emit - Configuration for outgoing events
 *   - `className`: Tailwind CSS classes (blue theme)
 *   - `icon`: Outgoing arrow icon
 *   - `label`: Display text "emit"
 * @property {object} subscribe - Configuration for incoming events
 *   - `className`: Tailwind CSS classes (green theme)
 *   - `icon`: Radio/signal icon
 *   - `label`: Display text "sub"
 *
 * @example
 * // Display event type badge
 * const config = TYPE_CONFIG["emit"];
 * <Badge className={config.className}>{config.icon} {config.label}</Badge>
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
 * Color palette for namespace filter pills.
 * Provides a consistent set of colors used to visually distinguish different WebSocket namespaces.
 *
 * The root namespace (`'/'`) always uses the first (zinc) color entry.
 * Other namespaces are assigned colors by their alphabetically sorted position.
 * This ensures consistent coloring across sessions.
 *
 * @type {Array<object>}
 * Each palette entry contains:
 * - `dot`: Tailwind class for filled dot indicator inside the pill
 * - `idle`: Tailwind classes for unselected/inactive pill state (with hover effects)
 * - `active`: Tailwind classes for selected/active pill state
 *
 * Supports up to 6 distinct namespaces with unique color schemes:
 * 1. Zinc (root namespace)
 * 2. Blue
 * 3. Purple
 * 4. Amber
 * 5. Teal
 * 6. Pink
 *
 * @example
 * // Get color for a namespace
 * const paletteIndex = getNamespacePaletteIndex(namespace);
 * const colors = NAMESPACE_PALETTE[paletteIndex];
 * <Pill className={colors.active}>{namespace}</Pill>
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

/**
 * Configuration for event direction filter buttons.
 * Defines the icon, label, and active state styling for each filter option.
 * Used in the UI to allow users to filter events by their direction (incoming, outgoing, or all).
 *
 * @type {Record<"all" | "out" | "in", object>}
 * Each entry contains:
 * - `icon`: Lucide React icon representing the direction
 * - `label`: Text label for the filter option
 * - `activeClass`: Tailwind CSS classes applied when this filter is active
 * The filter options are:
 * - `all`: Shows all events (default, neutral styling)
 * - `out`: Shows only emitted (outgoing) events (blue styling)
 * - `in`: Shows only subscribed (incoming) events (green styling)
 * @example
 * // Render direction filter buttons
 * Object.entries(DIRECTION_CONFIG).map(([key, config]) => (
 *   <Button key={key} className={isActive ? config.activeClass : ""}>
 *     {config.icon} {config.label}
 *   </Button>
 * ))
 */
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
