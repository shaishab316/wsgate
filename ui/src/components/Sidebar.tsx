import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { WsEvent, WsEventsResponse } from "@/types/ws-event";

interface Props {
  selected: WsEvent | null;
  onSelect: (event: WsEvent) => void;
}

export default function Sidebar({ selected, onSelect }: Props) {
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [title, setTitle] = useState("nestjs-wsgate");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventsUrl =
      params.get("eventsUrl") ?? "http://localhost:3000/wsgate/events.json";

    fetch(eventsUrl)
      .then((res) => res.json() as Promise<WsEventsResponse>)
      .then((data) => {
        setEvents(data.events);
        setTitle(data.title);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load events");
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Socket.IO Explorer</p>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <p className="text-xs text-zinc-600 text-center mt-4">
            Loading events...
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center mt-4">{error}</p>
        )}

        {!loading &&
          !error &&
          events.map((event) => (
            <button
              key={event.event}
              onClick={() => onSelect(event)}
              className={`w-full text-left px-4 py-2.5 flex flex-col gap-1 hover:bg-zinc-800 transition-colors border-l-2 ${
                selected?.event === event.event
                  ? "bg-zinc-800 border-blue-500"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-zinc-100">
                  {event.event}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    event.auth === "bearer"
                      ? "border-yellow-500 text-yellow-400"
                      : "border-zinc-600 text-zinc-500"
                  }`}
                >
                  {event.auth}
                </Badge>
              </div>
              <span className="text-xs text-zinc-500 truncate">
                {event.description}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
