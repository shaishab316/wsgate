/**
 * nestjs-wsgate
 *
 * Copyright (c) 2026 Shaishab Chandra Shil (@shaishab316)
 * MIT License — https://opensource.org/licenses/MIT
 *
 * An interactive WebSocket documentation UI for NestJS.
 * Like Swagger UI, but for Socket.IO gateway events.
 *
 * GitHub  : https://github.com/shaishab316/wsgate
 * npm     : https://www.npmjs.com/package/nestjs-wsgate
 *
 * @packageDocumentation
 */

export type { WsDocOptions } from "./decorators/ws-doc.decorator";
// ── Decorator ─────────────────────────────────────────
// Applied to gateway methods to mark them as documented socket events.
export { WSGATE_EVENT_METADATA, WsDoc } from "./decorators/ws-doc.decorator";
export type { WsEventMeta } from "./wsgate.explorer";
// ── Explorer ──────────────────────────────────────────
// Scans NestJS providers and collects @WsDoc() metadata at bootstrap.
export { WsgateExplorer } from "./wsgate.explorer";
export type { WsgateOptions } from "./wsgate.module";
// ── Core Module ───────────────────────────────────────
// Main entry point for setting up the wsgate UI in a NestJS application.
export { WsgateModule } from "./wsgate.module";
