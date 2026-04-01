const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
  listUsers,
  updateUserRole,
  toggleUserStatus,
} = require('../controllers/authController');

const { authenticate, authorise } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public
router.post(
  '/register',
  validate({
    name:     { required: true, minLength: 2, maxLength: 100 },
    email:    { required: true, isEmail: true },
    password: { required: true, minLength: 8 },
  }),
  register
);

router.post(
  '/login',
  validate({
    email:    { required: true, isEmail: true },
    password: { required: true },
  }),
  login
);

// Protected
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

// Admin-only user management
router.get('/users', authenticate, authorise('admin'), listUsers);
router.patch('/users/:id/role',   authenticate, authorise('admin'), updateUserRole);
router.patch('/users/:id/status', authenticate, authorise('admin'), toggleUserStatus);

module.exports = router;
