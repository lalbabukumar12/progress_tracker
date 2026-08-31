const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get chat message history for a room
// @route   GET /api/chat/history?room=general&limit=50
// @access  Public or Protected
router.get('/history', async (req, res) => {
  try {
    const room = req.query.room || 'general';
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    // Fetch latest 'limit' messages and sort chronologically (oldest to newest)
    const messages = await ChatMessage.find({ room })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Reverse to chronological order (oldest first)
    messages.reverse();

    res.status(200).json({
      room,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error loading chat history' });
  }
});

module.exports = router;
