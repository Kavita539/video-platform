let _io = null;

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');

  _io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  _io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined room user:${userId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return _io;
};

const getIO = () => {
  if (!_io) throw new Error('Socket.io not initialised. Call initSocket() first.');
  return _io;
};

/**
 * Emit a progress event to a specific user's room.
 * @param {string} userId
 * @param {string} videoId
 * @param {object} payload  { stage, progress, status, message }
 */
const emitProgress = (userId, videoId, payload) => {
  try {
    getIO()
      .to(`user:${userId}`)
      .emit('video:progress', { videoId, ...payload });
  } catch {
    //
  }
};

module.exports = { initSocket, getIO, emitProgress };
