const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const contestRoutes = require('./routes/contestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initSocketServer } = require('./socket');
const { handleCodeExecution } = require('./controllers/executeController');
const { getMonthlyTopPerformers } = require('./controllers/studentController');
const { protect } = require('./middleware/authMiddleware');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/chat', chatRoutes);
app.get('/api/monthly-top-performers', getMonthlyTopPerformers);
app.post('/api/execute', protect, handleCodeExecution);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server & Socket.IO running on port ${PORT}`);

  // Test outbound internet connectivity on startup
  try {
    const axios = require('axios');
    const testRes = await axios.get('https://codeforces.com/api/user.info?handles=tourist', { timeout: 6000 });
    if (testRes.data?.status === 'OK') {
      console.log('Outbound internet connection verified: successfully reached external APIs (Codeforces status 200 OK)');
    }
  } catch (netErr) {
    console.warn('Outbound internet connectivity warning:', netErr.message);
  }
});

