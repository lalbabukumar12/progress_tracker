const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const ChatMessage = require('./models/ChatMessage');

/**
 * Initialize and configure Socket.IO server
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // JWT Handshake Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (!token) {
        return next(new Error('Authentication error: Token is required'));
      }

      if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  // Helper to compute and broadcast online count for a room
  const broadcastOnlineCount = (roomName = 'general') => {
    const roomSockets = io.sockets.adapter.rooms.get(roomName);
    const count = roomSockets ? roomSockets.size : 0;
    io.to(roomName).emit('online_count', { room: roomName, count });
  };

  io.on('connection', (socket) => {
    const defaultRoom = 'general';
    socket.join(defaultRoom);

    // Broadcast current room presence
    broadcastOnlineCount(defaultRoom);

    // Handle incoming chat messages
    socket.on('send_message', async (data, callback) => {
      try {
        const text = typeof data === 'string' ? data : data?.message;
        const targetRoom = data?.room || defaultRoom;

        if (!text || !text.trim()) {
          if (typeof callback === 'function') callback({ error: 'Message text cannot be empty' });
          return;
        }

        const newChatMessage = await ChatMessage.create({
          senderId: socket.user._id,
          senderName: socket.user.username,
          message: text.trim(),
          room: targetRoom,
        });

        // Broadcast to all sockets in the room
        io.to(targetRoom).emit('new_message', newChatMessage);

        if (typeof callback === 'function') callback({ status: 'ok', message: newChatMessage });
      } catch (err) {
        console.error('[Socket] Error saving chat message:', err.message);
        if (typeof callback === 'function') callback({ error: 'Failed to send message' });
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      broadcastOnlineCount(defaultRoom);
    });
  });

  return io;
};

module.exports = {
  initSocketServer,
};
