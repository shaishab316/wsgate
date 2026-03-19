import { Badge } from "@/components/ui/badge";

const EVENTS = [
  { name: "sendMessage", type: "emit" },
  { name: "joinRoom", type: "emit" },
  { name: "leaveRoom", type: "emit" },
  { name: "onMessage", type: "subscribe" },
  { name: "onError", type: "subscribe" },
];

interface Props {
  selected: string | null;
  onSelect: (event: string) => void;
}

export default function Sidebar({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-100">nestjs-wsgate</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Socket.IO Explorer</p>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto py-2">
        {EVENTS.map((event) => (
          <button
            key={event.name}
            onClick={() => onSelect(event.name)}
            className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-zinc-800 transition-colors ${
              selected === event.name
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400"
            }`}
          >
            <span className="text-sm font-mono">{event.name}</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                event.type === "emit"
                  ? "border-blue-500 text-blue-400"
                  : "border-green-500 text-green-400"
              }`}
            >
              {event.type}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
