export function SidebarShimmerList() {
  return (
    <div className="flex flex-col py-2 px-2 gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg">
          {/* Icon + name + badge */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-zinc-800 animate-pulse shrink-0" />
            <div
              className="h-3 rounded bg-zinc-800 animate-pulse flex-1"
              style={{ width: `${45 + (i % 3) * 15}%` }}
            />
            <div className="h-4 w-10 rounded-full bg-zinc-800 animate-pulse shrink-0" />
          </div>
          {/* Description */}
          <div
            className="h-2.5 rounded bg-zinc-800/60 animate-pulse ml-6"
            style={{ width: `${55 + (i % 2) * 20}%` }}
          />
        </div>
      ))}
    </div>
  );
}
