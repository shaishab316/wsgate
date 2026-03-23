import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { wsgate } from '@wsgate/express';
import { wsgateDocs } from './wsgate-docs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// ── wsgate UI ─────────────────────────────────
app.use('/wsgate', wsgate(wsgateDocs));

// ── Socket.IO handlers ────────────────────────
io.on('connection', (socket) => {
  console.log(`client connected: ${socket.id}`);

  socket.on('join:room', (room: string) => {
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  socket.on('message:send', (data: { text: string; username: string }) => {
    console.log(`${data.username}: ${data.text}`);
    io.emit('message:receive', data);
  });

  socket.on('disconnect', () => {
    console.log(`client disconnected: ${socket.id}`);
  });
});

// ── Start ─────────────────────────────────────
httpServer.listen(3000, () => {
  console.log('→ http://localhost:3000/wsgate');
});
