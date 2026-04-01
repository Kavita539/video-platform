import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  const url = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    if (userId) socket.emit('join:user', userId);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export default { connectSocket, getSocket, disconnectSocket };
