const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, organisation } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      organisation: organisation || 'default',
      // First user in an org becomes admin (simple bootstrapping)
      role: 'editor',
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me  (protected)
 */
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/**
 * POST /api/auth/logout  (protected — client should discard token)
 */
const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * GET /api/auth/users  (admin only)
 */
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ organisation: req.user.organisation })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/users/:id/role  (admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!User.ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${User.ROLES.join(', ')}`,
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organisation: req.user.organisation },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/users/:id/status  (admin only)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organisation: req.user.organisation },
      [{ $set: { isActive: { $not: '$isActive' } } }],
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, logout, listUsers, updateUserRole, toggleUserStatus };
