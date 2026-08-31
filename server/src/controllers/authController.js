const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT Token with isAdmin in payload
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: Boolean(user.isAdmin) },
    process.env.JWT_SECRET || 'supersecretjwtkey_progress_tracker_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      const token = generateToken(user);
      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: Boolean(user.isAdmin),
        },
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    const identifier = (email || username || '').toLowerCase();

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user);
      res.status(200).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: Boolean(user.isAdmin),
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email/username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
