const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserStatus,
  deleteUser
} = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users with pagination and filters
router.get('/', getAllUsers);

// Get single user by ID
router.get('/:id', getUserById);

// Create new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Reset user password
router.put('/:id/reset-password', resetUserPassword);

// Toggle user status (activate/block)
router.put('/:id/toggle-status', toggleUserStatus);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;

