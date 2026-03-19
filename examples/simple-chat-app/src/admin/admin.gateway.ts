import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsDoc } from 'nestjs-wsgate';

/**
 * AdminGateway handles real-time WebSocket events for the admin panel.
 *
 * This gateway demonstrates two namespace behaviours provided by nestjs-wsgate:
 *
 * 1. **Auto-detection** — `@WsDoc()` events without an explicit `namespace`
 *    field automatically inherit `/admin` from the `@WebSocketGateway()` decorator.
 *
 * 2. **Manual override** — A single event can opt into a different namespace
 *    by setting `namespace` directly in `@WsDoc()`, overriding the class-level value.
 *
 * Connect to: ws://localhost:3000/admin
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/admin', // auto-detected by WsgateExplorer → '/admin'
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AdminGateway.name);

  // ── Lifecycle Hooks ───────────────────────────────────

  handleConnection(client: Socket) {
    this.logger.log(`Admin client connected    → ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Admin client disconnected → ${client.id}`);
  }

  // ── Emit Events (client → server) ────────────────────
  // namespace is auto-detected from @WebSocketGateway({ namespace: 'admin' }) → '/admin'

  /**
   * Broadcast a system-wide alert to all connected admin clients.
   *
   * @emits admin:alert - Delivers the alert to all admin clients.
   */
  @WsDoc({
    // namespace not set → auto-detected as '/admin'
    event: 'admin:alert',
    description: 'Broadcast a system-wide alert to all admin clients.',
    payload: { message: 'string', severity: 'low | medium | high | critical' },
    response: 'admin:alert',
    type: 'emit',
  })
  @SubscribeMessage('admin:alert')
  handleAlert(
    @MessageBody() body: { message: string; severity: string },
  ): void {
    this.logger.warn(`Admin alert [${body.severity}]: ${body.message}`);
    this.server.emit('admin:alert', {
      message: body.message,
      severity: body.severity,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Kick a connected client by socket ID.
   *
   * @emits admin:kicked - Notifies the target client before disconnection.
   */
  @WsDoc({
    // namespace not set → auto-detected as '/admin'
    event: 'admin:kick',
    description: 'Kick a connected client by socket ID.',
    payload: { clientId: 'string', reason: 'string' },
    response: 'admin:kicked',
    type: 'emit',
  })
  @SubscribeMessage('admin:kick')
  handleKick(@MessageBody() body: { clientId: string; reason: string }): void {
    this.logger.warn(`Kicking client ${body.clientId}: ${body.reason}`);
    this.server.to(body.clientId).emit('admin:kicked', { reason: body.reason });
    this.server.in(body.clientId).disconnectSockets(true);
  }

  // ── Manual namespace override ─────────────────────────
  // This event is shared with the public /metrics namespace.
  // The explicit namespace in @WsDoc() overrides the class-level '/admin'.

  /**
   * Request a snapshot of live server metrics.
   *
   * @emits metrics:snapshot - Delivers the metrics snapshot to the requester.
   */
  @WsDoc({
    event: 'metrics:request',
    description: 'Request a live snapshot of server metrics.',
    payload: { fields: 'string' },
    response: 'metrics:snapshot',
    type: 'emit',
  })
  @SubscribeMessage('metrics:request')
  handleMetricsRequest(@MessageBody() body: { fields: string }): void {
    this.logger.log(`Metrics requested: ${body.fields}`);
    this.server.emit('metrics:snapshot', {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  // ── Subscribe Events (server → client) ───────────────
  // These methods exist purely for nestjs-wsgate documentation.
  // They are never called — the server emits these events directly.

  /**
   * Received by all admin clients when an alert is broadcast.
   */
  @WsDoc({
    // namespace not set → auto-detected as '/admin'
    event: 'admin:alert',
    description: 'Received by all admin clients when an alert is broadcast.',
    payload: {
      message: 'string',
      severity: 'low | medium | high | critical',
      timestamp: 'string',
    },
    type: 'subscribe',
  })
  onAlert(): void {}

  /**
   * Received by a client when they have been kicked by an admin.
   */
  @WsDoc({
    // namespace not set → auto-detected as '/admin'
    event: 'admin:kicked',
    description: 'Received by a client when they are kicked by an admin.',
    payload: { reason: 'string' },
    type: 'subscribe',
  })
  onKicked(): void {}

  /**
   * Received by the requester with live server metrics.
   */
  @WsDoc({
    event: 'metrics:snapshot',
    description: 'Received with a live snapshot of server metrics.',
    payload: {
      cpu: 'string',
      memory: 'string',
      uptime: 'string',
      timestamp: 'string',
    },
    type: 'subscribe',
  })
  onMetricsSnapshot(): void {}
}
