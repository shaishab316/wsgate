/**
 * nestjs-wsgate — AuthorCard v3
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * Interaction:
 *   - Collapsed: tiny GitHub icon pill
 *   - Hover: card springs upward (scaleY from bottom), full profile
 *             reveals section-by-section with staggered fade-up
 */

import { useState, useEffect, useRef, Fragment } from "react";
import {
  Github,
  BookOpen,
  Package,
  MapPin,
  Building2,
  Link2,
  Users,
  GitFork,
  BookMarked,
  CalendarDays,
  Briefcase,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  company: string | null;
  blog: string | null;
  location: string | null;
  bio: string | null;
  hireable: boolean | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: string;
}

const FALLBACK: GitHubUser = {
  login: "shaishab316",
  avatar_url: "https://avatars.githubusercontent.com/u/109936547?v=4",
  name: "Shaishab Chandra Shil",
  company: "@Joint-Venture-AI",
  blog: "https://shaishab316.github.io",
  location: "Bangladesh",
  bio: "Tools don't create engineers. Struggle does. Just keep trying.",
  hireable: true,
  public_repos: 99,
  public_gists: 2,
  followers: 25,
  following: 111,
  html_url: "https://github.com/shaishab316",
  created_at: "2022-07-25T03:56:58Z",
};

// ── Stack tags ────────────────────────────────────────

const STACK = [
  {
    label: "NestJS",
    color: "text-red-400",
    bg: "bg-red-500/8",
    border: "border-red-500/20",
  },
  {
    label: "TypeScript",
    color: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
  },
  {
    label: "Node.js",
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
  },
  {
    label: "PostgreSQL",
    color: "text-sky-400",
    bg: "bg-sky-500/8",
    border: "border-sky-500/20",
  },
  {
    label: "Redis",
    color: "text-orange-400",
    bg: "bg-orange-500/8",
    border: "border-orange-500/20",
  },
  {
    label: "Socket.IO",
    color: "text-violet-400",
    bg: "bg-violet-500/8",
    border: "border-violet-500/20",
  },
] as const;

// ── Count-up ──────────────────────────────────────────

function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active || target === 0) {
      setValue(0);
      return;
    }
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setValue(Math.round((1 - (1 - p) ** 2) * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active, duration]);

  return value;
}

// ── StatPill ──────────────────────────────────────────

function StatPill({
  icon: Icon,
  rawValue,
  label,
  accent,
  active,
  delay,
}: {
  icon: React.ElementType;
  rawValue: number;
  label: string;
  accent: string;
  active: boolean;
  delay: number;
}) {
  const count = useCountUp(rawValue, active);
  const display = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count;
  return (
    <div
      className="ac-reveal flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/60 hover:bg-zinc-900 transition-all duration-200 group cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon
        className={`w-3.5 h-3.5 ${accent} mb-0.5 group-hover:scale-110 transition-transform duration-150`}
      />
      <span className="text-[12px] font-semibold font-mono text-zinc-200 leading-none tabular-nums">
        {display}
      </span>
      <span className="text-[9px] text-zinc-700 font-mono uppercase tracking-wider leading-none mt-0.5">
        {label}
      </span>
    </div>
  );
}

// ── MetaRow ───────────────────────────────────────────

function MetaRow({
  icon: Icon,
  text,
  href,
  accent = "text-zinc-500",
  delay,
}: {
  icon: React.ElementType;
  text: string;
  href?: string;
  accent?: string;
  delay: number;
}) {
  const inner = (
    <div className="flex items-center gap-2 group">
      <Icon className={`w-3 h-3 shrink-0 ${accent}`} />
      <span
        className={`text-[11px] font-mono truncate ${
          href
            ? "text-zinc-400 group-hover:text-zinc-200 transition-colors duration-150 underline underline-offset-2 decoration-zinc-700"
            : "text-zinc-500"
        }`}
      >
        {text}
      </span>
    </div>
  );
  return (
    <div className="ac-reveal" style={{ animationDelay: `${delay}ms` }}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}

// ── Links ─────────────────────────────────────────────

const LINKS = [
  {
    href: "https://github.com/shaishab316",
    icon: <Github className="w-3.5 h-3.5" />,
    label: "GitHub",
  },
  {
    href: "https://shaishab316.hashnode.dev",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    label: "Blog",
  },
  {
    href: "https://npmjs.com/package/nestjs-wsgate",
    icon: <Package className="w-3.5 h-3.5" />,
    label: "npm",
  },
] as const;

// ── Component ─────────────────────────────────────────

export default function AuthorCard() {
  const [user, setUser] = useState<GitHubUser>(FALLBACK);
  const [hovered, setHovered] = useState(false);
  const [countActive, setCountActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/users/shaishab316")
      .then((r) => r.json())
      .then((d: GitHubUser) => setUser(d))
      .catch(() => {});
  }, []);

  const onEnter = () => {
    setHovered(true);
    timer.current = setTimeout(() => setCountActive(true), 120);
  };
  const onLeave = () => {
    setHovered(false);
    setCountActive(false);
    if (timer.current) clearTimeout(timer.current);
  };

  const memberSince = new Date(user.created_at).getFullYear();
  const cleanBlog = user.blog?.replace(/^https?:\/\//, "") ?? "";
  const cleanCompany = user.company?.replace(/^@/, "") ?? "";

  return (
    <div
      className="relative flex justify-center"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* ══════════════════════════════════
          PILL — visible when NOT hovered
          ══════════════════════════════════ */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-zinc-900/60 cursor-default select-none"
        style={{
          borderColor: hovered ? "rgba(99,102,241,0.4)" : "rgba(63,63,70,0.8)",
          boxShadow: hovered
            ? "0 0 14px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.025)"
            : "inset 0 1px 0 rgba(255,255,255,0.02)",
          transition:
            "opacity 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
          opacity: hovered ? 0 : 1,
          pointerEvents: hovered ? "none" : "auto",
        }}
      >
        <Github className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[11px] font-mono text-zinc-600">shaishab316</span>
        <span
          className="size-1.5 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 5px rgba(52,211,153,0.55)" }}
        />
      </div>

      {/* ══════════════════════════════════
          EXPANDED CARD — grows on hover
          ══════════════════════════════════ */}
      <div
        className="absolute bottom-0 left-1/2 w-100 rounded-xl border bg-zinc-950 overflow-hidden"
        style={{
          transform: `translateX(-50%) scaleY(${hovered ? 1 : 0}) translateY(0)`,
          transformOrigin: "bottom center",
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? "auto" : "none",
          transition:
            "transform 0.40s cubic-bezier(0.34,1.48,0.64,1), opacity 0.22s ease, border-color 0.2s ease",
          borderColor: hovered ? "rgba(99,102,241,0.22)" : "rgba(63,63,70,0.8)",
          boxShadow:
            "0 -12px 48px rgba(0,0,0,0.55), 0 -1px 0 rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        {/* Terminal chrome */}
        <div
          className="ac-reveal flex items-center gap-2 px-3 py-2 border-b border-zinc-800/60"
          style={{
            animationDelay: "30ms",
            background:
              "linear-gradient(180deg,rgba(39,39,42,0.85) 0%,rgba(24,24,27,0.4) 100%)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-zinc-700 hover:bg-red-400/80 transition-colors duration-150" />
            <span className="size-2.5 rounded-full bg-zinc-700 hover:bg-amber-400/80 transition-colors duration-150" />
            <span className="size-2.5 rounded-full bg-zinc-700 hover:bg-emerald-400/80 transition-colors duration-150" />
          </div>
          <span className="flex-1 text-center text-[10px] font-mono text-zinc-600">
            shaishab316 — profile.json
          </span>
          <div className="w-10.5" />
        </div>

        {/* Banner */}
        <div
          className="ac-reveal relative h-11 border-b border-zinc-800/60 overflow-hidden"
          style={{
            animationDelay: "50ms",
            background:
              "linear-gradient(135deg,rgba(18,18,20,1) 0%,rgba(49,46,129,0.12) 55%,rgba(18,18,20,1) 100%)",
          }}
        >
          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(113,119,144,0.12) 9px,rgba(113,119,144,0.12) 10px)," +
                "repeating-linear-gradient(90deg,transparent,transparent 9px,rgba(113,119,144,0.12) 9px,rgba(113,119,144,0.12) 10px)",
            }}
          />
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-6 pointer-events-none opacity-40"
            style={{
              background:
                "linear-gradient(180deg,transparent,rgba(99,102,241,0.08),transparent)",
              animation: "_ac_scanline 3s linear infinite",
            }}
          />
          {/* Glow */}
          <div
            className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-10 opacity-25"
            style={{
              background:
                "radial-gradient(ellipse,rgba(99,102,241,0.5) 0%,transparent 70%)",
              filter: "blur(10px)",
            }}
          />
          {user.hireable && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest leading-none">
                Open to Work
              </span>
            </div>
          )}
        </div>

        {/* Avatar + name */}
        <div
          className="ac-reveal px-4 pt-3 pb-3 flex items-center gap-3 border-b border-zinc-800/60"
          style={{ animationDelay: "70ms" }}
        >
          <div className="relative shrink-0 -mt-7">
            <div
              className="p-0.5 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg,rgba(99,102,241,0.5),rgba(52,211,153,0.25))",
              }}
            >
              <img
                src={user.avatar_url}
                alt={user.name}
                className="size-12 rounded-full border-2 border-zinc-950 bg-zinc-900 block invert dark:invert-0"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-zinc-950 flex items-center justify-center">
              <div
                className="size-2 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 6px rgba(52,211,153,0.6)" }}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[13px] font-semibold text-zinc-100 truncate leading-snug">
              {user.name}
            </p>
            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
              @{user.login}
            </p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div
            className="ac-reveal px-4 py-2.5 border-b border-zinc-800/60"
            style={{ animationDelay: "90ms" }}
          >
            <div className="relative pl-3">
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg,rgba(99,102,241,0.5),rgba(99,102,241,0.06))",
                }}
              />
              <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                {user.bio}
              </p>
            </div>
          </div>
        )}

        {/* Meta rows */}
        <div className="px-4 py-3 flex flex-col gap-2 border-b border-zinc-800/60">
          {cleanCompany && (
            <MetaRow
              icon={Building2}
              text={cleanCompany}
              accent="text-blue-500"
              delay={105}
            />
          )}
          {user.location && (
            <MetaRow
              icon={MapPin}
              text={user.location}
              accent="text-amber-500"
              delay={118}
            />
          )}
          {user.blog && (
            <MetaRow
              icon={Link2}
              text={cleanBlog}
              href={user.blog}
              accent="text-violet-400"
              delay={131}
            />
          )}
          <MetaRow
            icon={CalendarDays}
            text={`Member since ${memberSince}`}
            accent="text-zinc-600"
            delay={144}
          />
        </div>

        {/* Stats */}
        <div className="px-4 py-3 grid grid-cols-4 gap-2 border-b border-zinc-800/60">
          <StatPill
            icon={GitFork}
            rawValue={user.public_repos}
            label="repos"
            accent="text-blue-400"
            active={countActive}
            delay={157}
          />
          <StatPill
            icon={Users}
            rawValue={user.followers}
            label="followers"
            accent="text-emerald-400"
            active={countActive}
            delay={170}
          />
          <StatPill
            icon={Briefcase}
            rawValue={user.following}
            label="following"
            accent="text-violet-400"
            active={countActive}
            delay={183}
          />
          <StatPill
            icon={BookMarked}
            rawValue={user.public_gists}
            label="gists"
            accent="text-amber-400"
            active={countActive}
            delay={196}
          />
        </div>

        {/* Stack */}
        <div
          className="ac-reveal px-4 py-3 border-b border-zinc-800/60"
          style={{ animationDelay: "210ms" }}
        >
          <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-2">
            Stack
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STACK.map((t, i) => (
              <span
                key={t.label}
                className={`ac-reveal text-[9px] font-mono px-2 py-0.5 rounded-md border ${t.color} ${t.bg} ${t.border}`}
                style={{ animationDelay: `${218 + i * 16}ms` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Link row */}
        <div className="ac-reveal flex" style={{ animationDelay: "320ms" }}>
          {LINKS.map((link, i) => (
            <Fragment key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all duration-150 group/link"
              >
                <span className="group-hover/link:scale-110 transition-transform duration-150">
                  {link.icon}
                </span>
                {link.label}
              </a>
              {i < LINKS.length - 1 && <div className="w-px bg-zinc-800/60" />}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
