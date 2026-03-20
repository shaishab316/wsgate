import { Tag, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface Preset {
  id: string;
  name: string;
  payload: string;
  createdAt: string;
}

export function PresetsDropdown({
  presets,
  onLoad,
  onSave,
  onDelete,
  onClose,
}: {
  presets: Preset[];
  currentPayload: string;
  onLoad: (payload: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  function handleSave() {
    const name = newName.trim();
    if (!name) return;
    onSave(name);
    setNewName("");
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-72 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-zinc-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Saved Presets
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/60">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Preset name…"
          className="flex-1 text-[11px] bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-200 placeholder:text-zinc-700 font-mono outline-none focus:border-zinc-600 transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={!newName.trim()}
          className="shrink-0 text-[10px] text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 hover:border-zinc-500 rounded-lg px-2.5 py-1.5 transition-all bg-zinc-900 hover:bg-zinc-800"
        >
          Save
        </button>
      </div>
      {presets.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <p className="text-[11px] text-zinc-600">No presets saved yet</p>
        </div>
      ) : (
        <div className="max-h-52 overflow-y-auto">
          {presets.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30 last:border-0 group"
            >
              <Tag className="w-3 h-3 text-zinc-600 shrink-0" />
              <span className="flex-1 text-[11px] font-mono text-zinc-300 truncate">
                {p.name}
              </span>
              <button
                onClick={() => {
                  onLoad(p.payload);
                  onClose();
                }}
                className="text-[9px] text-blue-500 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                Load
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
