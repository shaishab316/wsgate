import { INestApplication, Module } from "@nestjs/common";
import { WsgateExplorer } from "./wsgate.explorer";
import * as path from "node:path";
import * as express from "express";

/**
 * Configuration options for the WsgateModule.
 */
export interface WsgateOptions {
  /**
   * The title displayed in the wsgate UI header.
   *
   * @default 'WsGate'
   */
  title?: string;
}

/**
 * WsgateModule is a lightweight NestJS module that provides an interactive
 * WebSocket documentation UI — similar to Swagger UI but for Socket.IO events.
 *
 * It works by scanning all NestJS providers at bootstrap for methods decorated
 * with `@WsDoc()`, collecting their metadata, and exposing it through a
 * self-contained HTML UI served at the specified path.
 *
 * ---
 *
 * ### How It Works
 * 1. `WsgateExplorer` scans all providers for `@WsDoc()` metadata.
 * 2. Collected events are exposed at `{path}/events.json`.
 * 3. An interactive HTML UI is served at `{path}`.
 * 4. The UI fetches `events.json` and renders each event as an interactive card.
 *
 * ---
 *
 * ### Requirements
 * - `WsgateExplorer` must be registered as a provider in your root module
 *   **before** calling `WsgateModule.setup()`.
 *
 * @example
 * ```ts
 * // main.ts
 * const app = await NestFactory.create(AppModule);
 * await WsgateModule.setup('/wsgate', app, { title: 'Chat API' });
 * await app.listen(3000);
 * ```
 */
@Module({})
export class WsgateModule {
  /**
   * Mounts the wsgate interactive UI onto the NestJS application.
   *
   * This method performs three things:
   * - Resolves `WsgateExplorer` from the DI container.
   * - Serves collected `@WsDoc()` event metadata at `{routePath}/events.json`.
   * - Serves the interactive HTML UI at `{routePath}`.
   *
   * @param routePath - The route path to mount wsgate (e.g. `'/wsgate'`).
   * @param app       - The running NestJS application instance.
   * @param options   - Optional configuration. See {@link WsgateOptions}.
   * @returns         A promise that resolves when setup is complete.
   *
   * @example
   * ```ts
   * await WsgateModule.setup('/wsgate', app, { title: 'My Chat API' });
   * // UI available at http://localhost:3000/wsgate
   * // Events JSON  at http://localhost:3000/wsgate/events.json
   * ```
   */
  static async setup(
    routePath: string,
    app: INestApplication,
    options?: WsgateOptions,
  ): Promise<void> {
    const title = options?.title ?? "WsGate";

    // Resolve WsgateExplorer from the DI container.
    // If it has not been registered, throw a clear error to guide the user.
    const explorer = await app.resolve(WsgateExplorer).catch(() => {
      throw new Error(
        `[nestjs-wsgate] WsgateExplorer is not registered. ` +
          `Make sure to add WsgateExplorer to your root module providers.`,
      );
    });

    // Collect all @WsDoc() decorated gateway methods
    const events = explorer.explore();

    // ── Expose raw event metadata as JSON ─────────────────
    // The UI fetches this endpoint to render event cards dynamically.
    app.use(`${routePath}/events.json`, (_req: any, res: any) => {
      res.json({ title, events });
    });

    // ── Resolve the UI HTML from @wsgate/ui package ───────
    // Works both in monorepo (workspace:*) and after publishing to npm.
    const uiHtmlPath = path.join(
      path.dirname(require.resolve("@wsgate/ui/package.json")),
      "dist",
      "index.html",
    );

    // Serve the singlefile HTML — all JS/CSS is already inlined by vite-plugin-singlefile
    app.use(routePath, (_req: any, res: any) => {
      res.sendFile(uiHtmlPath);
    });
  }
}
