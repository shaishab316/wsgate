import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsDoc } from 'nestjs-wsgate';

/**
 * ChatGateway handles all real-time WebSocket events for the chat system.
 *
 * This gateway demonstrates the full usage of `@WsDoc()` from nestjs-wsgate,
 * including public events, bearer-protected events, room management,
 * and server-to-client emissions.
 *
 * Connect to: ws://localhost:3000
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // ── Lifecycle Hooks ───────────────────────────────────

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected    → ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected → ${client.id}`);
  }

  // ── Events ────────────────────────────────────────────

  /**
   * Echo a message back to all connected clients.
   * The server prefixes the message with "Server: ".
   *
   * @emits message - Broadcasts the echoed message to all clients.
   */
  @WsDoc({
    event: 'message',
    description: 'Send a message — server echoes it back to everyone.',
    payload: { msg: 'string' },
    response: 'message',
    auth: 'none',
  })
  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: { msg: string }): void {
    this.logger.log(`message → ${body.msg}`);
    this.server.emit('message', `Server: ${body.msg}`);
  }

  /**
   * Join a named chat room.
   * After joining, the client will receive messages sent to that room.
   *
   * @emits room:joined - Notifies the room that a new user has joined.
   */
  @WsDoc({
    event: 'room:join',
    description: 'Join a chat room by name.',
    payload: { room: 'string', username: 'string' },
    response: 'room:joined',
    auth: 'none',
  })
  @SubscribeMessage('room:join')
  handleJoinRoom(
    @MessageBody() body: { room: string; username: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(body.room);
    this.logger.log(`${body.username} joined room → ${body.room}`);

    this.server.to(body.room).emit('room:joined', {
      room: body.room,
      username: body.username,
      message: `${body.username} has joined the room.`,
    });
  }

  /**
   * Send a message to a specific chat room.
   * Only clients who have joined the room will receive it.
   *
   * @emits room:message - Delivers the message to all room members.
   */
  @WsDoc({
    event: 'room:message',
    description: 'Send a message to a specific room.',
    payload: { room: 'string', username: 'string', msg: 'string' },
    response: 'room:message',
    auth: 'none',
  })
  @SubscribeMessage('room:message')
  handleRoomMessage(
    @MessageBody() body: { room: string; username: string; msg: string },
  ): void {
    this.logger.log(`[${body.room}] ${body.username}: ${body.msg}`);

    this.server.to(body.room).emit('room:message', {
      username: body.username,
      msg: body.msg,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Leave a chat room.
   *
   * @emits room:left - Notifies the room that a user has left.
   */
  @WsDoc({
    event: 'room:leave',
    description: 'Leave a chat room.',
    payload: { room: 'string', username: 'string' },
    response: 'room:left',
    auth: 'none',
  })
  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @MessageBody() body: { room: string; username: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(body.room);
    this.logger.log(`${body.username} left room → ${body.room}`);

    this.server.to(body.room).emit('room:left', {
      room: body.room,
      username: body.username,
      message: `${body.username} has left the room.`,
    });
  }

  /**
   * Send a private direct message to a specific socket client.
   * Requires a valid Bearer token.
   *
   * @emits dm - Delivers the message to the target client only.
   */
  @WsDoc({
    event: 'dm',
    description: 'Send a private direct message to a specific client.',
    payload: { toClientId: 'string', msg: 'string' },
    response: 'dm',
    auth: 'bearer',
  })
  @SubscribeMessage('dm')
  handleDirectMessage(
    @MessageBody() body: { toClientId: string; msg: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`DM from ${client.id} → ${body.toClientId}: ${body.msg}`);

    this.server.to(body.toClientId).emit('dm', {
      from: client.id,
      msg: body.msg,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast a system-wide notification to all connected clients.
   * Requires a valid Bearer token (admin only).
   *
   * @emits notification - Delivers the notification to all clients.
   */
  @WsDoc({
    event: 'notification',
    description: 'Broadcast a system notification to all clients. Admin only.',
    payload: { message: 'string', level: 'info | warn | error' },
    response: 'notification',
    auth: 'bearer',
  })
  @SubscribeMessage('notification')
  handleNotification(
    @MessageBody() body: { message: string; level: string },
  ): void {
    this.logger.warn(`System notification [${body.level}]: ${body.message}`);

    this.server.emit('notification', {
      message: body.message,
      level: body.level,
      timestamp: new Date().toISOString(),
    });
  }
}
