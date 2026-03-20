import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WsEvent } from "@/types/ws-event";
import type { LogEntry } from "@/types/log";

interface WsgateState {
  // ── Persisted ─────────────────────────────────────────
  url: string;
  token: string;
  selectedEvent: WsEvent | null;
  selectedNamespace: string;

  // ── Volatile ──────────────────────────────────────────
  logs: LogEntry[];
  logId: number;
  availableNamespaces: string[];

  // ── Actions ───────────────────────────────────────────
  setUrl: (url: string) => void;
  setToken: (token: string) => void;
  setSelectedEvent: (event: WsEvent | null) => void;
  setSelectedNamespace: (namespace: string) => void;
  setAvailableNamespaces: (namespaces: string[]) => void;
  addLog: (direction: "in" | "out", event: string, data: unknown) => number;
  addAck: (logId: number, data: unknown) => void;
  clearLogs: () => void;
}

/**
 * Re-export the store state type for use in component prop types.
 * Avoids the `ReturnType<typeof useWsgateStore>` anti-pattern which
 * returns the hook signature, not the state shape.
 */
export type SelectedEvent = NonNullable<WsgateState["selectedEvent"]>;

export type Log = WsgateState["logs"][number];

/**
 * Zustand store for managing WebSocket Gateway state and operations.
 *
 * @remarks
 * This store manages both persisted and volatile state for a WebSocket Gateway client.
 * Persisted state includes URL, token, selected event, and namespace preferences.
 * Volatile state includes logs and available namespaces.
 *
 * @example
 * ```typescript
 * const store = useWsgateStore();
 * store.setUrl("http://example.com:3000");
 * store.addLog("in", "message", { content: "Hello" });
 * ```
 *
 * @returns {WsgateState} The Zustand store with state properties and action methods
 *
 * @property {string} url - WebSocket server URL (from query params or default localhost:3000)
 * @property {string} token - Authentication token for WebSocket connections
 * @property {SelectedEvent | null} selectedEvent - Currently selected event for inspection
 * @property {string} selectedNamespace - Currently selected namespace (default: "/")
 * @property {Log[]} logs - Array of all logged messages and events (volatile, non-persisted)
 * @property {number} logId - Auto-incrementing counter for log entry IDs
 * @property {string[]} availableNamespaces - List of discovered namespaces (volatile, non-persisted)
 *
 * @method setUrl - Update the WebSocket server URL
 * @method setToken - Update the authentication token
 * @method setSelectedEvent - Update the selected event and optionally its namespace
 * @method setSelectedNamespace - Update the selected namespace
 * @method setAvailableNamespaces - Update the list of available namespaces
 * @method addLog - Add a new log entry and return its ID
 * @method addAck - Add acknowledgment data to an existing log entry
 * @method clearLogs - Clear all log entries
 */
export const useWsgateStore = create<WsgateState>()(
  persist(
    (set, get) => ({
      // ── Persisted initial state ────────────────────────
      url:
        new URLSearchParams(window.location.search).get("url") ??
        "http://localhost:3000",
      token: "",
      selectedEvent: null,
      selectedNamespace: "/",

      // ── Volatile initial state ─────────────────────────
      logs: [],
      logId: 0,
      availableNamespaces: ["/"],

      // ── Actions ────────────────────────────────────────
      setUrl: (url) => set({ url }),
      setToken: (token) => set({ token }),
      setSelectedEvent: (selectedEvent) => {
        // When selecting an event, also update the namespace
        if (selectedEvent) {
          const ns = selectedEvent.namespace ?? "/";
          set({ selectedEvent, selectedNamespace: ns });
        } else {
          set({ selectedEvent });
        }
      },
      setSelectedNamespace: (selectedNamespace) => set({ selectedNamespace }),
      setAvailableNamespaces: (availableNamespaces) =>
        set({ availableNamespaces }),

      addLog: (direction, event, data) => {
        const id = get().logId;
        set((s) => ({
          logId: s.logId + 1,
          logs: [
            ...s.logs,
            {
              id,
              timestamp: new Date().toLocaleTimeString(),
              direction,
              event,
              data,
            },
          ],
        }));
        return id;
      },

      addAck: (logId, data) => {
        set((s) => ({
          logs: s.logs.map((log) =>
            log.id === logId
              ? {
                  ...log,
                  ack: {
                    timestamp: new Date().toLocaleTimeString(),
                    data,
                  },
                }
              : log,
          ),
        }));
      },

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: "wsgate:state",
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields — logs are volatile
      partialize: (state) => ({
        url: state.url,
        token: state.token,
        selectedEvent: state.selectedEvent,
        selectedNamespace: state.selectedNamespace,
      }),
    },
  ),
);
