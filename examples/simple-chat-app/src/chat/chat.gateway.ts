import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsDoc } from 'nestjs-wsgate';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  @WsDoc({
    event: 'message',
    description: 'Client sends a message, server echoes it back',
    payload: { msg: 'string' },
    response: 'message',
  })
  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: { msg: string }) {
    console.log(`Client said: ${body.msg}`);
    this.server.emit('message', `Server: ${body.msg}`);
  }
}
