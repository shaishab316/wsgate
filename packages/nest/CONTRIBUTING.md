# Contributing to @wsgate/nest

The NestJS adapter living in `packages/nest/`. This guide covers the architecture, patterns, and conventions before touching the code.

---

## Local Dev

```bash
# From monorepo root
pnpm --filter @wsgate/nest build

# Watch mode
pnpm --filter @wsgate/nest build --watch
```

Test against the example app:

```bash
pnpm --filter simple-chat-app start:dev
# → http://localhost:3000/wsgate
```

---

## Project Structure

```
packages/nest/src/
├── decorators/
│   └── ws-doc.decorator.ts   # @WsDoc() decorator + WsDocOptions type
├── wsgate.explorer.ts         # Scans DI container for @WsDoc() metadata
├── wsgate.module.ts           # Module + static setup() method
└── index.ts                   # Public API surface
```

---

## How It Works

1. User registers `WsgateExplorer` as a provider in their root module
2. User calls `WsgateModule.setup(path, app)` in `main.ts`
3. `setup()` resolves `WsgateExplorer` from the DI container
4. `WsgateExplorer.explore()` scans all providers for `WSGATE_EVENT_METADATA`
5. Collected events are exposed at `{path}/events.json`
6. The `@wsgate/ui` singlefile HTML is served at `{path}`

---

## Adding to the Decorator

`WsDocOptions` lives in `src/decorators/ws-doc.decorator.ts`. If you add a new option:

- Add it to the `WsDocOptions` interface with JSDoc
- Apply a sensible default inside the `WsDoc()` function using `??=`
- Export it from `src/index.ts` if it needs to be public

```ts
export interface WsDocOptions {
  event: string;
  // add new option here with JSDoc
}
```

---

## Adding to the Explorer

`WsgateExplorer` uses `DiscoveryService` from `@nestjs/core` to iterate providers. Keep it stateless — `explore()` should always return a fresh result from metadata, never cache.

---

## Exports

Only export what users need from `src/index.ts`:

```ts
export {
  WsDoc,
  WsDocOptions,
  WSGATE_EVENT_METADATA,
} from "./decorators/ws-doc.decorator";
export { WsgateModule, WsgateOptions } from "./wsgate.module";
export { WsgateExplorer } from "./wsgate.explorer";
```

Don't export internal types or helpers.

---

## Build

```bash
pnpm --filter @wsgate/nest build
```

Output goes to `packages/nest/dist/`. The `dist/` folder is what gets published to npm.

---

## UI Path Resolution

`@wsgate/nest` resolves the UI HTML from `@wsgate/ui` via:

```ts
const uiHtmlPath = path.join(
  path.dirname(require.resolve("@wsgate/ui/package.json")),
  "dist",
  "index.html",
);
```

This works both in the monorepo (`workspace:*`) and after publishing to npm. Never hardcode a relative path.

---

## PR Checklist

- [ ] `pnpm --filter @wsgate/nest build` passes with no errors
- [ ] `pnpm --filter simple-chat-app start:dev` works end-to-end
- [ ] JSDoc added for any new public API
- [ ] New exports added to `src/index.ts`
- [ ] `WsDocOptions` interface updated if decorator options changed
