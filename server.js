require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/error');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const sendEmail = require('./services/emailService');
const { checkExpiredSubscriptions } = require('./services/subscriptionService');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://gym-frontend-hz0n.onrender.com', 'https://starfitnesspetlad.netlify.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://starfitnesspetlad.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files with proper headers and CORS
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'https://starfitnesspetlad.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  next();
}, express.static(path.join(__dirname, 'public/uploads')));

// Create receipts directory if it doesn't exist
const receiptDir = path.join(__dirname, 'public/receipts');
if (!fs.existsSync(receiptDir)) {
  fs.mkdirSync(receiptDir, { recursive: true });
}

// Serve receipt files with proper headers
app.use('/receipts', (req, res, next) => {
  const filePath = path.join(__dirname, 'public/receipts', req.path);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'https://starfitnesspetlad.netlify.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Receipt not found'
    });
  }
}, express.static(path.join(__dirname, 'public/receipts')));

// Database connection
connectDB();

// Mount routes - ensure the path is a simple string
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/health', healthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// 404 handler - use a simple string path
app.use('/404', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Route not found'
  });
});

// Catch-all route handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Check subscriptions every day at midnight
const scheduleSubscriptionCheck = () => {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // tomorrow
    0, 0, 0 // midnight
  );
  const timeToMidnight = night.getTime() - now.getTime();

  setTimeout(() => {
    checkExpiredSubscriptions();
    // Run every 24 hours
    setInterval(checkExpiredSubscriptions, 24 * 60 * 60 * 1000);
  }, timeToMidnight);
};

scheduleSubscriptionCheck();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION!');
  console.log(err.name, err.message);
  process.exit(1);
});