const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  // adminCreateUser will be added to allow admin/subadmin to create users
  adminCreateUser,
} = require('../controllers/adminController');
const { authMiddleware, adminMiddleware, requirePermission } = require('../middleware/auth');

router.get('/stats', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);
// Create user or sub-admin with permissions
// Create user or sub-admin with permissions (admin or subadmin with 'manage_users')
router.post('/users', authMiddleware, requirePermission('manage_users'), adminCreateUser);

module.exports = router;
