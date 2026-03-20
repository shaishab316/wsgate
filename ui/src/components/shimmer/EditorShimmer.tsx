export function EditorShimmer() {
  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-zinc-800 animate-pulse"
          style={{ width: `${30 + (i % 4) * 15}%` }}
        />
      ))}
    </div>
  );
}
