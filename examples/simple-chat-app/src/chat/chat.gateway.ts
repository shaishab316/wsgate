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
import { WsDoc } from '@wsgate/nest';

/**
 * ChatGateway demonstrates simple real-world WebSocket messaging.
 * Handles room-based chat and direct messaging between clients.
 *
 * Connect to: ws://localhost:3000/chat
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private logger = new Logger(ChatGateway.name);
  private userNames = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.userNames.set(client.id, `User_${client.id.substring(0, 5)}`);
  }

  handleDisconnect(client: Socket) {
    const username = this.userNames.get(client.id);
    this.logger.log(`Client disconnected: ${username}`);
    this.userNames.delete(client.id);
  }

  @WsDoc({
    event: 'message:send',
    description: 'Send a message to a specific room.',
    payload: { room: 'string', text: 'string' },
    response: 'message:receive',
    type: 'emit',
  })
  @SubscribeMessage('message:send')
  handleSendMessage(
    @MessageBody() data: { room: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const username = this.userNames.get(client.id);
    this.server.to(data.room).emit('message:receive', {
      username,
      text: data.text,
      timestamp: new Date().toISOString(),
    });
    return { status: 'delivered', timestamp: new Date().toISOString() };
  }

  @WsDoc({
    event: 'room:join',
    description: 'Join a chat room.',
    payload: { room: 'string' },
    response: 'room:joined',
    type: 'emit',
  })
  @SubscribeMessage('room:join')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const username = this.userNames.get(client.id);
    client.join(data.room);
    this.server.to(data.room).emit('room:joined', {
      username,
      message: `${username} joined the room`,
      timestamp: new Date().toISOString(),
    });
    return {
      status: 'joined',
      room: data.room,
      timestamp: new Date().toISOString(),
    };
  }

  @WsDoc({
    event: 'room:leave',
    description: 'Leave a chat room.',
    payload: { room: 'string' },
    response: 'room:left',
    type: 'emit',
  })
  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const username = this.userNames.get(client.id);
    client.leave(data.room);
    this.server.to(data.room).emit('room:left', {
      username,
      message: `${username} left the room`,
      timestamp: new Date().toISOString(),
    });
    return {
      status: 'left',
      room: data.room,
      timestamp: new Date().toISOString(),
    };
  }

  @WsDoc({
    event: 'dm:send',
    description: 'Send a direct message to another user.',
    payload: { toUserId: 'string', text: 'string' },
    response: 'dm:receive',
    type: 'emit',
  })
  @SubscribeMessage('dm:send')
  handleDirectMessage(
    @MessageBody() data: { toUserId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const username = this.userNames.get(client.id);
    this.server.to(data.toUserId).emit('dm:receive', {
      from: username,
      text: data.text,
      timestamp: new Date().toISOString(),
    });
    return {
      status: 'sent',
      toUserId: data.toUserId,
      timestamp: new Date().toISOString(),
    };
  }

  @WsDoc({
    event: 'message:receive',
    description: 'Receive a message in a room.',
    payload: { username: 'string', text: 'string', timestamp: 'string' },
    type: 'subscribe',
  })
  onMessageReceive() {}

  @WsDoc({
    event: 'room:joined',
    description: 'User joined the room.',
    payload: { username: 'string', message: 'string', timestamp: 'string' },
    type: 'subscribe',
  })
  onRoomJoined() {}

  @WsDoc({
    event: 'room:left',
    description: 'User left the room.',
    payload: { username: 'string', message: 'string', timestamp: 'string' },
    type: 'subscribe',
  })
  onRoomLeft() {}

  @WsDoc({
    event: 'dm:receive',
    description: 'Receive a direct message.',
    payload: { from: 'string', text: 'string', timestamp: 'string' },
    type: 'subscribe',
  })
  onDirectMessage() {}
}
