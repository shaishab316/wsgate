# Contributing to nestjs-wsgate UI

The UI is a Vite + React + Tailwind app living in the `ui/` directory. This guide covers patterns, conventions, and decisions you need to know before touching the code.

---

## Local Dev

```bash
cd ui
pnpm install
pnpm dev   # or: make
```

Connect to a local NestJS app running `WsgateModule.setup()` on `ws://localhost:3000`.

---

## Project Structure

```
ui/src/
├── components/
│   └── sub-components/   # Shared UI primitives
│       └── Config.tsx     # Shared constants (icons, colors, patterns)
├── lib/
│   └── utils.ts          # Pure utility functions
└── store/                # Zustand stores
```

---

## Adding a Component

Create the file under `src/components/sub-components/`, add JSDoc, and type all props explicitly — no `any`.

````tsx
/**
 * MyComponent — Brief description.
 *
 * @example
 * ```tsx
 * <MyComponent onAction={() => {}} />
 * ```
 *
 * @param onAction - Called when the user triggers the action
 * @param disabled - Disables interaction
 */
export function MyComponent({
  onAction,
  disabled,
}: {
  onAction: () => void;
  disabled?: boolean;
}) {
  // ...
}
````

- Style with Tailwind only — no inline styles, no CSS modules
- Always test in both light and dark themes

---

## Adding a Utility Function

- Add to `src/lib/utils.ts`
- Must be pure — no side effects
- Include JSDoc with at least one `@example`
- Add tests if the logic is non-trivial

---

## Adding Shared Constants

Recurring icons, colors, or type mappings belong in `src/components/sub-components/Config.ts`:

```tsx
export const TYPE_ICON = {
  emit: { icon: <Send className="w-3 h-3" />, label: "Emit" },
  listen: { icon: <Radio className="w-3 h-3" />, label: "Listen" },
};
```

---

## Common Patterns

### Store

```tsx
const { selectedEvent, setSelectedEvent } = useWsgateStore();
```

### Icon Buttons

```tsx
<CopyButton text={payload} />  {/* Tooltip + Copy → Check animation */}

<IconBtn title="Export" onClick={handleExport} activeClass="text-blue-400">
  <Download className="w-4 h-4" />
</IconBtn>
```

### Accessible Clickable Divs

Native `<button>` is preferred. If you need a non-button element:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={onToggle}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") onToggle();
  }}
  className="cursor-pointer"
>
  Click me
</div>
```

---

## Performance Notes

### Use `<pre>` for logs, not Monaco

Monaco requires an explicit pixel height. With dynamic content this means fighting ResizeObserver, incorrect line-height math, and clipped output. `<pre>` with `highlightJson()` gives exact content height, instant rendering for 200+ entries, and a ~100× smaller bundle.

### Memoization and debouncing

Use `useMemo` for expensive calculations, `debounce` for storage writes:

```tsx
const payload = useMemo(() => buildPayloadSkeleton(...), [selected]);

const debouncedSave = useCallback(
  debounce((val) => saveToStorage(key, val), 500),
  [key],
);
```

Don't reach for these reflexively — only when there's a measurable reason.

---

## Security

- Auth token is masked in the UI and stored in `localStorage` under `wsgate:token`
- Never log the token or expose it to external services

---

## Troubleshooting

| Symptom                                 | Fix                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `Cannot find module '@react-hookz/web'` | Don't add external deps — use native hooks or custom `useMediaQuery()`  |
| Monaco panel shows blank                | Check `editorReady` state — there's a 300ms reset delay on event change |
| Logs appear after disconnect            | Ensure `useSocketStore` clears `onMessageCallback` on disconnect        |
| Light theme colors look wrong           | Use `bg-white dark:bg-zinc-950` pattern, check `dark:` annotations      |

---

## PR Checklist

- [ ] Tested in light and dark themes
- [ ] No external dependencies added
- [ ] JSDoc added for new components and utilities
- [ ] `Config.ts` updated if a new shared constant was introduced
- [ ] This document updated if architecture changed
