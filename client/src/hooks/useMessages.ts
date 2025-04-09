// client/src/hooks/useMessages.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useMessages() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token: user.token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.token]);

  const joinConversation = (conversationId: string) => {
    socket?.emit('joinConversation', conversationId);
  };

  const onNewMessage = (callback: (data: any) => void) => {
    socket?.on('newMessage', callback);
    return () => {
      socket?.off('newMessage', callback);
    };
  };

  return { socket, joinConversation, onNewMessage };
}