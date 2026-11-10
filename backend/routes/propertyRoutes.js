const express = require('express');
const router = express.Router();
const {
  getAllProperties,
  getFeaturedProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
  getNextSequentialId,
} = require('../controllers/propertyController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const { imageFileFilter, validatePropertyImages } = require('../middleware/propertyImageValidation');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage (disk)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: imageFileFilter,
});

// Public routes - Order matters! Specific routes must come before generic /:id
router.get('/featured', getFeaturedProperties);
router.get('/search', searchProperties);
router.get('/next-id/:category', getNextSequentialId);
router.get('/', getAllProperties);
router.get('/:id', getPropertyById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 20), validatePropertyImages, createProperty);
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 20), validatePropertyImages, updateProperty);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProperty);

module.exports = router;
