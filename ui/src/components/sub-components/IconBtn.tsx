export function IconBtn({
  onClick,
  title,
  active,
  activeClass = "text-blue-400 border-blue-500/20 bg-blue-500/8",
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  activeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md border transition-all ${
        active
          ? activeClass
          : "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
