const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
} = require('../controllers/inquiryController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public route
router.post('/', createInquiry);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllInquiries);
router.get('/:id', authMiddleware, adminMiddleware, getInquiryById);
router.put('/:id', authMiddleware, adminMiddleware, updateInquiryStatus);
router.delete('/:id', authMiddleware, adminMiddleware, deleteInquiry);

module.exports = router;
