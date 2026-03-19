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
 * documenting both client → server (`emit`) and server → client (`subscribe`)
 * events for the nestjs-wsgate interactive UI.
 *
 * Connect to: ws://localhost:3000
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
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

  // ── Emit Events (client → server) ────────────────────

  /**
   * Echo a message back to all connected clients.
   *
   * @emits message - Broadcasts the echoed message to all clients.
   */
  @WsDoc({
    event: 'message',
    description: 'Send a message — server echoes it back to everyone.',
    payload: { msg: 'string' },
    response: 'message',
    type: 'emit',
  })
  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: { msg: string }): void {
    this.logger.log(`message → ${body.msg}`);
    this.server.emit('message', `Server: ${body.msg}`);
  }

  /**
   * Join a named chat room.
   *
   * @emits room:joined - Notifies the room that a new user has joined.
   */
  @WsDoc({
    event: 'room:join',
    description: 'Join a chat room by name.',
    payload: { room: 'string', username: 'string' },
    response: 'room:joined',
    type: 'emit',
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
   *
   * @emits room:message - Delivers the message to all room members.
   */
  @WsDoc({
    event: 'room:message',
    description: 'Send a message to a specific room.',
    payload: { room: 'string', username: 'string', msg: 'string' },
    response: 'room:message',
    type: 'emit',
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
    type: 'emit',
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
   *
   * @emits dm - Delivers the message to the target client only.
   */
  @WsDoc({
    event: 'dm',
    description: 'Send a private direct message to a specific client.',
    payload: { toClientId: 'string', msg: 'string' },
    response: 'dm',
    type: 'emit',
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
   *
   * @emits notification - Delivers the notification to all clients.
   */
  @WsDoc({
    event: 'notification',
    description: 'Broadcast a system notification to all clients.',
    payload: { message: 'string', level: 'info | warn | error' },
    response: 'notification',
    type: 'emit',
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

  // ── Subscribe Events (server → client) ───────────────
  // These methods exist purely for nestjs-wsgate documentation.
  // They are never called — the server emits these events directly.

  /**
   * Received by all clients when a message is broadcast.
   */
  @WsDoc({
    event: 'message',
    description: 'Received by all clients when a message is broadcast.',
    payload: { msg: 'string' },
    type: 'subscribe',
  })
  onMessage(): void {}

  /**
   * Received by room members when a new user joins.
   */
  @WsDoc({
    event: 'room:joined',
    description: 'Received by room members when a new user joins.',
    payload: { room: 'string', username: 'string', message: 'string' },
    type: 'subscribe',
  })
  onRoomJoined(): void {}

  /**
   * Received by room members when a user sends a message.
   */
  @WsDoc({
    event: 'room:message',
    description: 'Received by room members when a message is sent.',
    payload: { username: 'string', msg: 'string', timestamp: 'string' },
    type: 'subscribe',
  })
  onRoomMessage(): void {}

  /**
   * Received by room members when a user leaves.
   */
  @WsDoc({
    event: 'room:left',
    description: 'Received by room members when a user leaves.',
    payload: { room: 'string', username: 'string', message: 'string' },
    type: 'subscribe',
  })
  onRoomLeft(): void {}

  /**
   * Received by the target client when a direct message is sent.
   */
  @WsDoc({
    event: 'dm',
    description: 'Received when someone sends you a direct message.',
    payload: { from: 'string', msg: 'string', timestamp: 'string' },
    type: 'subscribe',
  })
  onDm(): void {}

  /**
   * Received by all clients when a system notification is broadcast.
   */
  @WsDoc({
    event: 'notification',
    description:
      'Received by all clients when a system notification is broadcast.',
    payload: {
      message: 'string',
      level: 'info | warn | error',
      timestamp: 'string',
    },
    type: 'subscribe',
  })
  onNotification(): void {}
}
