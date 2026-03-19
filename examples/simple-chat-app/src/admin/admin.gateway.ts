import {
  ConnectedSocket,
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
 * AdminGateway handles admin operations like announcements and server monitoring.
 *
 * Connect to: ws://localhost:3000/admin
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/admin',
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private logger = new Logger(AdminGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Admin connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Admin disconnected: ${client.id}`);
  }

  @WsDoc({
    event: 'announce:send',
    description: 'Broadcast an announcement to all connected users.',
    payload: {
      title: 'string',
      message: 'string',
      level: 'info | warning | error',
    },
    response: 'announce:receive',
    type: 'emit',
  })
  @SubscribeMessage('announce:send')
  handleAnnouncement(
    @MessageBody() data: { title: string; message: string; level: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`[${data.level}] ${data.title}: ${data.message}`);
    this.server.emit('announce:receive', {
      title: data.title,
      message: data.message,
      level: data.level,
      timestamp: new Date().toISOString(),
    });
    return {
      status: 'announced',
      recipients: 'all',
      timestamp: new Date().toISOString(),
    };
  }

  @WsDoc({
    event: 'kick:user',
    description: 'Disconnect a user from the server.',
    payload: { socketId: 'string', reason: 'string' },
    response: 'user:kicked',
    type: 'emit',
  })
  @SubscribeMessage('kick:user')
  handleKickUser(
    @MessageBody() data: { socketId: string; reason: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.socketId).emit('user:kicked', {
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });
    this.server.in(data.socketId).disconnectSockets(true);
    this.logger.warn(`User kicked: ${data.socketId} - ${data.reason}`);
    return {
      status: 'kicked',
      socketId: data.socketId,
      timestamp: new Date().toISOString(),
    };
  }

  @WsDoc({
    event: 'stats:request',
    description: 'Get current server statistics.',
    payload: {},
    response: 'stats:response',
    type: 'emit',
  })
  @SubscribeMessage('stats:request')
  handleStatsRequest(@ConnectedSocket() client: Socket) {
    client.emit('stats:response', {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  }

  @WsDoc({
    event: 'announce:receive',
    description: 'Receive an announcement from admin.',
    payload: {
      title: 'string',
      message: 'string',
      level: 'string',
      timestamp: 'string',
    },
    type: 'subscribe',
  })
  onAnnouncement() {}

  @WsDoc({
    event: 'user:kicked',
    description: 'User has been kicked from the server.',
    payload: { reason: 'string', timestamp: 'string' },
    type: 'subscribe',
  })
  onUserKicked() {}

  @WsDoc({
    event: 'stats:response',
    description: 'Server statistics response.',
    payload: { uptime: 'number', memory: 'object', timestamp: 'string' },
    type: 'subscribe',
  })
  onStatsResponse() {}
}
