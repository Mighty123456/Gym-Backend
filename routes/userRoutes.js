const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// Public route
router.post('/register', upload.single('photo'), handleUploadError, userController.register);

// Protected routes - require authentication
router.use(protect); // Apply authentication middleware to all routes below

// Admin only routes
router.get('/', userController.getAllUsers);
router.patch('/approve/:userId', protect, userController.approvePayment);
router.patch('/:id', protect, userController.updateUser);
router.delete('/:id', protect, userController.deleteUser);
router.post('/notify-expired/:userId', protect, userController.notifyExpiredMember);

module.exports = router;