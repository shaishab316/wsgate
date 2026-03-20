import { PanelResizeHandle } from "react-resizable-panels";

export function NavResizeHandle() {
  return (
    <PanelResizeHandle
      style={{ height: "36px" }}
      className="group relative w-3 flex items-center justify-center cursor-col-resize shrink-0"
    >
      <div className="flex flex-col gap-0.75 opacity-30 group-hover:opacity-100 transition-opacity duration-150">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-0.75 rounded-full bg-zinc-400 group-hover:bg-blue-400 group-active:bg-blue-300 transition-colors duration-150"
          />
        ))}
      </div>
    </PanelResizeHandle>
  );
}
