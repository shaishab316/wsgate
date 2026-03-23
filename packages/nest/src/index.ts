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

// ── Core Module ───────────────────────────────────────
// Main entry point for setting up the wsgate UI in a NestJS application.
export { WsgateModule } from "./wsgate.module";
export type { WsgateOptions } from "./wsgate.module";

// ── Explorer ──────────────────────────────────────────
// Scans NestJS providers and collects @WsDoc() metadata at bootstrap.
export { WsgateExplorer } from "./wsgate.explorer";
export type { WsEventMeta } from "./wsgate.explorer";

// ── Decorator ─────────────────────────────────────────
// Applied to gateway methods to mark them as documented socket events.
export { WsDoc } from "./decorators/ws-doc.decorator";
export type { WsDocOptions } from "./decorators/ws-doc.decorator";
export { WSGATE_EVENT_METADATA } from "./decorators/ws-doc.decorator";
