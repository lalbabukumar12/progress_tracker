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

// CORS configuration (allow cross-origin API requests on Vercel)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);
app.options('*', cors());

// Body parser
app.use(express.json());

// Database connection middleware for serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection middleware error:', err.message);
  }
  next();
});

// Root welcome / health route for Vercel
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Progress Tracker Backend API is live',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/chat', chatRoutes);
app.get('/api/monthly-top-performers', getMonthlyTopPerformers);
app.post('/api/execute', protect, handleCodeExecution);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Initialize Socket.IO only for non-serverless long-running node processes
let io;
if (!process.env.VERCEL) {
  try {
    io = initSocketServer(server);
  } catch (err) {
    console.warn('Socket.IO initialization skipped or failed:', err.message);
  }
}

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
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
}

module.exports = app;
