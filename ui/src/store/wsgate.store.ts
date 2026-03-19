import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WsEvent } from "@/types/ws-event";
import type { LogEntry } from "@/types/log";

interface WsgateState {
  // ── Persisted ─────────────────────────────────────────
  url: string;
  token: string;
  selectedEvent: WsEvent | null;

  // ── Volatile ──────────────────────────────────────────
  logs: LogEntry[];
  logId: number;

  // ── Actions ───────────────────────────────────────────
  setUrl: (url: string) => void;
  setToken: (token: string) => void;
  setSelectedEvent: (event: WsEvent | null) => void;
  addLog: (direction: "in" | "out", event: string, data: unknown) => void;
  clearLogs: () => void;
}

/**
 * Re-export the store state type for use in component prop types.
 * Avoids the `ReturnType<typeof useWsgateStore>` anti-pattern which
 * returns the hook signature, not the state shape.
 */
export type SelectedEvent = NonNullable<WsgateState["selectedEvent"]>;

export type Log = WsgateState["logs"][number];

export const useWsgateStore = create<WsgateState>()(
  persist(
    (set, get) => ({
      // ── Persisted initial state ────────────────────────
      url:
        new URLSearchParams(window.location.search).get("url") ??
        "http://localhost:3000",
      token: "",
      selectedEvent: null,

      // ── Volatile initial state ─────────────────────────
      logs: [],
      logId: 0,

      // ── Actions ────────────────────────────────────────
      setUrl: (url) => set({ url }),
      setToken: (token) => set({ token }),
      setSelectedEvent: (selectedEvent) => set({ selectedEvent }),

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
      }),
    },
  ),
);
