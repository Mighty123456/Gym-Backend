const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Public route
router.post('/register', upload.single('photo'), userController.register);

// Protected routes - require authentication
router.use(protect); // Apply authentication middleware to all routes below

// Admin only routes
router.get('/', userController.getAllUsers);
router.patch('/approve/:userId', protect, userController.approvePayment);
router.patch('/:id', protect, userController.updateUser);
router.delete('/:id', protect, userController.deleteUser);
router.post('/notify-expired/:userId', protect, userController.notifyExpiredMember);

module.exports = router;