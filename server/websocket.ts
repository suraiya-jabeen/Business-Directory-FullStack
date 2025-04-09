// server/websocket.ts
import http from 'http';
import { Server } from 'socket.io';

export function setupWebSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    // Join conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}