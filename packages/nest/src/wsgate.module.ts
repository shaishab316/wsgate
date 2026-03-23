import { INestApplication, Module } from '@nestjs/common';
import { WsgateExplorer } from './wsgate.explorer';
import * as path from 'node:path';
import * as fs from 'node:fs';

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

  /**
   * Disable the wsgate UI entirely.
   * Useful for production environments.
   *
   * @default false
   *
   * @example
   * ```ts
   * await WsgateModule.setup('/wsgate', app, {
   *   disabled: process.env.NODE_ENV === 'production',
   * });
   * ```
   */
  disabled?: boolean;
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
    if (options?.disabled) return;

    const title = options?.title ?? 'WsGate';

    // Resolve WsgateExplorer from the DI container.
    const explorer = await app.resolve(WsgateExplorer).catch(() => {
      throw new Error(
        `[nestjs-wsgate] WsgateExplorer is not registered. ` +
          `Make sure to add WsgateExplorer to your root module providers.`,
      );
    });

    const events = explorer.explore();

    // ── Expose raw event metadata as JSON ─────────────────
    app.use(`${routePath}/events.json`, (_req: any, res: any) => {
      res.json({ title, events });
    });

    // ── Resolve and serve the UI HTML ─────────────────────
    // Resolves from @wsgate/ui package — works in monorepo and after npm install.
    const uiHtmlPath = path.join(
      path.dirname(require.resolve('@wsgate/ui/package.json')),
      'dist',
      'index.html',
    );

    const uiHtml = fs.readFileSync(uiHtmlPath, 'utf-8');

    app.use(routePath, (_req: any, res: any) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(uiHtml);
    });
  }
}
