import { FAKER_VARS, type FakerVarDef } from "@/lib/faker";
import { FlaskConical, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Slide-in reference panel listing all available {{$var}} tokens.
 * Clicking a variable inserts it into the editor at cursor, or
 * copies it to clipboard if no editor ref is available.
 */
export function FakerVarsPanel({
  onInsert,
  onClose,
}: {
  onInsert: (snippet: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const typeGroups = useMemo(() => {
    const filtered = Object.entries(FAKER_VARS).filter(([name, def]) => {
      if (!search) return true;
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        def.description.toLowerCase().includes(search.toLowerCase())
      );
    });
    const groups: Record<string, [string, FakerVarDef][]> = {};
    for (const [name, def] of filtered) {
      const g = def.type;
      if (!groups[g]) groups[g] = [];
      groups[g].push([name, def]);
    }
    return groups;
  }, [search]);

  const typeColor: Record<string, string> = {
    string: "text-amber-400  border-amber-500/25  bg-amber-500/8",
    number: "text-purple-400 border-purple-500/25 bg-purple-500/8",
    boolean: "text-pink-400   border-pink-500/25   bg-pink-500/8",
    uuid: "text-cyan-400   border-cyan-500/25   bg-cyan-500/8",
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-80 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/70 overflow-hidden flex flex-col"
      style={{ maxHeight: "420px" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/80 shrink-0">
        <Sparkles className="w-3 h-3 text-violet-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 flex-1">
          Faker Variables
        </span>
        <span className="text-[9px] text-zinc-600 font-mono">
          Ctrl+Space in editor
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-zinc-800/50 shrink-0">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search variables…"
          className="w-full text-[11px] bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 placeholder:text-zinc-700 font-mono outline-none focus:border-zinc-600 transition-colors"
          autoFocus
        />
      </div>

      {/* Variable list */}
      <div className="overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:rgba(113,119,144,0.4)_transparent]">
        {Object.entries(typeGroups).map(([type, vars]) => (
          <div key={type}>
            <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/30">
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeColor[type] ?? "text-zinc-500 border-zinc-700"}`}
              >
                {type}
              </span>
            </div>
            {vars.map(([name, def]) => (
              <button
                key={name}
                onClick={() => {
                  onInsert(`{{${name}}}`);
                  onClose();
                }}
                className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-zinc-800/60 transition-colors text-left group border-b border-zinc-800/20 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-violet-300 group-hover:text-violet-200">
                      {`{{${name}}}`}
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-0.5 truncate">
                    {def.description}
                  </p>
                  <p className="text-[9px] text-zinc-700 font-mono truncate">
                    eg. {def.example}
                  </p>
                </div>
                <span className="text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                  Insert →
                </span>
              </button>
            ))}
          </div>
        ))}
        {Object.keys(typeGroups).length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-[11px] text-zinc-600">No variables match</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-zinc-800/50 shrink-0 flex items-center gap-2">
        <FlaskConical className="w-3 h-3 text-zinc-700" />
        <span className="text-[9px] text-zinc-700">
          Variables resolve at emit time — re-rolled every send
        </span>
      </div>
    </div>
  );
}
