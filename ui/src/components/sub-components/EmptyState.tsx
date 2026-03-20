/**
 * nestjs-wsgate — EmptyState v2
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * Redesign highlights:
 *   - Dot-grid + radial-glow atmosphere layer
 *   - Typewriter tagline with blinking cursor
 *   - Gradient shimmer title text
 *   - Feature tiles with per-accent glow on hover
 *   - Glowing divider with center beam
 *   - Staggered fade-up entry animation
 */

import { useEffect, useState } from "react";
import { MousePointerClick } from "lucide-react";
import appIcon from "@/assets/icon.png";
import AuthorCard from "./AuthorCard";

// ── Global keyframes (injected once) ─────────────────

const CSS = `
@keyframes _wsgate_fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes _wsgate_glowPulse {
  0%,100% { box-shadow: 0 0 0px  0px rgba(99,102,241,0);    }
  50%     { box-shadow: 0 0 22px 6px rgba(99,102,241,0.12); }
}
@keyframes _wsgate_blink {
  0%,100% { opacity: 1; }
  50%     { opacity: 0; }
}
@keyframes _wsgate_shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.wsg-fadeUp  { animation: _wsgate_fadeUp 0.45s ease both; }
.wsg-glow    { animation: _wsgate_glowPulse 3.5s ease-in-out infinite; }
.wsg-cursor  { animation: _wsgate_blink 1s step-end infinite; }
.wsg-shimmer {
  background: linear-gradient(
    120deg,
    #e4e4e7 0%,
    #a1a1aa 30%,
    #818cf8 50%,
    #a1a1aa 70%,
    #e4e4e7 100%
  );
  background-size: 250% auto;
  animation: _wsgate_shimmer 5s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
`;

function useGlobalStyles() {
  useEffect(() => {
    const id = "__wsgate_css__";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);
}

// ── Typewriter hook ───────────────────────────────────

function useTypewriter(full: string, speed = 38) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setText("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [full, speed]);
  return { text, done };
}

// ── Feature data ──────────────────────────────────────

const FEATURES = [
  {
    mono: "{{$var}}",
    label: "Faker vars",
    sub: "25 types",
    color: "text-violet-400",
    glow: "rgba(167,139,250,0.18)",
    border: "rgba(167,139,250,0.35)",
  },
  {
    mono: "×N emit",
    label: "Multi-emit",
    sub: "Stress test",
    color: "text-blue-400",
    glow: "rgba(96,165,250,0.18)",
    border: "rgba(96,165,250,0.35)",
  },
  {
    mono: "history",
    label: "Presets",
    sub: "Save payloads",
    color: "text-amber-400",
    glow: "rgba(251,191,36,0.18)",
    border: "rgba(251,191,36,0.35)",
  },
  {
    mono: "ACK",
    label: "ACK viewer",
    sub: "+ latency",
    color: "text-emerald-400",
    glow: "rgba(52,211,153,0.18)",
    border: "rgba(52,211,153,0.35)",
  },
  {
    mono: '{"json"}',
    label: "Code gen",
    sub: "Export SDK",
    color: "text-zinc-400",
    glow: "rgba(161,161,170,0.12)",
    border: "rgba(161,161,170,0.28)",
  },
  {
    mono: "⌘+↵",
    label: "Shortcuts",
    sub: "Fast workflow",
    color: "text-zinc-500",
    glow: "rgba(113,113,122,0.10)",
    border: "rgba(113,113,122,0.22)",
  },
] as const;

// ── Keyboard pill ─────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-700/80 bg-zinc-800/70 text-zinc-400 leading-none"
      style={{
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {children}
    </kbd>
  );
}

// ── FeatureTile ───────────────────────────────────────

function FeatureTile({
  mono,
  label,
  sub,
  color,
  glow,
  border,
  delay,
}: (typeof FEATURES)[number] & { delay: number }) {
  return (
    <div
      className="wsg-fadeUp flex flex-col gap-1 px-2.5 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 cursor-default"
      style={{
        animationDelay: `${delay}ms`,
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = border;
        el.style.boxShadow = `0 0 14px ${glow}, inset 0 1px 0 rgba(255,255,255,0.025)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "";
        el.style.boxShadow = "";
      }}
    >
      <span className={`text-[10px] font-mono leading-none ${color}`}>
        {mono}
      </span>
      <span className="text-[11px] font-medium text-zinc-300 leading-tight">
        {label}
      </span>
      <span className="text-[10px] text-zinc-700 font-mono leading-none">
        {sub}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────

export default function EmptyState() {
  useGlobalStyles();
  const { text: tagline, done: taglineDone } = useTypewriter(
    "Interactive UI for Socket.IO gateways.",
  );

  return (
    <div className="relative flex flex-col items-center h-full overflow-y-auto px-8 py-10 select-none [scrollbar-width:thin] [scrollbar-color:rgba(113,119,144,0.3)_transparent]">
      {/* ── Dot-grid atmosphere ── */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(161,161,170,0.9) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Radial top-glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        }}
      />

      {/* ── Logo ── */}
      <div
        className="wsg-fadeUp wsg-glow relative mb-5"
        style={{ animationDelay: "0ms" }}
      >
        <div
          className="size-26 rounded-[18px] border border-zinc-800 bg-zinc-900 flex items-center justify-center"
          style={{
            boxShadow:
              "0 4px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(99,102,241,0.08)",
          }}
        >
          <img
            src={appIcon}
            alt="nestjs-wsgate logo"
            className="size-20 invert dark:invert-0"
          />
        </div>
        {/* Corner accents */}
        <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-indigo-500/25 rounded-tr-[18px]" />
        <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-indigo-500/25 rounded-bl-[18px]" />
      </div>

      {/* ── Title ── */}
      <h1
        className="wsg-fadeUp wsg-shimmer text-[25px] font-semibold font-mono tracking-tight mb-1.5"
        style={{ animationDelay: "70ms" }}
      >
        nestjs-wsgate
      </h1>

      {/* ── Typewriter tagline ── */}
      <p
        className="wsg-fadeUp text-[12px] text-zinc-500 text-center leading-relaxed font-mono min-h-8.5 mb-4"
        style={{ animationDelay: "130ms" }}
      >
        {tagline}
        {!taglineDone && (
          <span className="wsg-cursor inline-block w-px h-2.75 bg-indigo-400 ml-0.5 align-middle" />
        )}
        {taglineDone && (
          <>
            <br />
            <span className="text-zinc-600">Built for NestJS developers.</span>
          </>
        )}
      </p>

      {/* ── Badges ── */}
      <div
        className="wsg-fadeUp flex items-center gap-2 mb-8"
        style={{ animationDelay: "190ms" }}
      >
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
          v1.0.0
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          MIT
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-500 border border-zinc-700/50">
          NestJS · Socket.IO
        </span>
      </div>

      {/* ── CTA ── */}
      <div
        className="wsg-fadeUp w-full max-w-xs mb-8"
        style={{ animationDelay: "250ms" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.025)" }}
        >
          {/* Icon chip */}
          <div className="shrink-0 size-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <MousePointerClick className="w-3 h-3 text-indigo-400" />
          </div>
          <span className="text-[12px] text-zinc-500 leading-snug">
            Select an event from the sidebar to begin
          </span>
        </div>
      </div>

      {/* ── Feature grid ── */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-2 mb-8">
        {FEATURES.map((f, i) => (
          <FeatureTile key={f.label} {...f} delay={310 + i * 45} />
        ))}
      </div>

      {/* ── Shortcuts ── */}
      <div
        className="wsg-fadeUp flex items-center gap-4 mb-8"
        style={{ animationDelay: "560ms" }}
      >
        <div className="flex items-center gap-1.5">
          <Kbd>⌘</Kbd>
          <Kbd>↵</Kbd>
          <span className="text-[11px] text-zinc-600 ml-0.5">emit</span>
        </div>
        <div className="w-px h-3 bg-zinc-800" />
        <div className="flex items-center gap-1.5">
          <Kbd>⌃</Kbd>
          <Kbd>Space</Kbd>
          <span className="text-[11px] text-zinc-600 ml-0.5">faker vars</span>
        </div>
      </div>

      {/* ── Glowing divider ── */}
      <div
        className="wsg-fadeUp w-full max-w-xs mb-7 relative h-px"
        style={{ animationDelay: "610ms" }}
      >
        <div className="absolute inset-0 bg-zinc-800/50" />
        {/* Center accent beam */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-20 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)",
            filter: "blur(0.5px)",
          }}
        />
      </div>

      {/* ── Author card ── */}
      <div
        className="wsg-fadeUp min-h-fit w-full max-w-xs"
        style={{ animationDelay: "650ms" }}
      >
        <AuthorCard />
      </div>

      <p
        className="wsg-fadeUp text-[10px] text-zinc-800 mt-6 font-mono"
        style={{ animationDelay: "700ms" }}
      >
        nestjs-wsgate · MIT License
      </p>
    </div>
  );
}
