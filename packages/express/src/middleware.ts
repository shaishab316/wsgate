import * as path from 'node:path';
import * as fs from 'node:fs';
import { Router } from 'express';
import { WsgateOptions } from './types';

/**
 * Express middleware that mounts the wsgate interactive UI.
 *
 * @example
 * ```ts
 * import { wsgate } from '@wsgate/express';
 *
 * app.use('/wsgate', wsgate({
 *   title: 'My App',
 *   events: [
 *     {
 *       event: 'message:send',
 *       description: 'Send a message',
 *       payload: { text: 'string' },
 *       type: 'emit',
 *     }
 *   ]
 * }));
 * ```
 */
export function wsgate(options: WsgateOptions): Router {
  const router = Router();

  if (options.disabled) return router;

  const title = options.title ?? 'WsGate';
  const events = options.events ?? [];

  // ── Expose event metadata as JSON ─────────────────────
  router.get('/events.json', (_req, res) => {
    res.json({ title, events });
  });

  // ── Serve the UI HTML ──────────────────────────────────
  const uiHtmlPath = path.join(
    path.dirname(require.resolve('@wsgate/ui/package.json')),
    'dist',
    'index.html',
  );

  const uiHtml = fs.readFileSync(uiHtmlPath, 'utf-8');

  router.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(uiHtml);
  });

  return router;
}
