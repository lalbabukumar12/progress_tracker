const express = require('express');
const router = express.Router();
const { getUpcomingContests } = require('../services/contestService');

// @desc    Get upcoming programming contests across platforms
// @route   GET /api/contests/upcoming
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await getUpcomingContests({ forceRefresh });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching upcoming contests' });
  }
});

module.exports = router;
