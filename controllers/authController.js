const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { generateReceipt } = require('../services/pdfService');
const User = require('../models/User');
const { sendEmail, createPaymentConfirmationEmail } = require('../services/emailService');
const { getPlanAmount, getPlanDisplayName } = require('../utils/formatters');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check if admin exists && password is correct
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // If everything ok, send token to client
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    res.status(200).json({
      status: 'success',
      token
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyToken = async (req, res) => {
  // If the middleware passes, the token is valid
  res.status(200).json({
    status: 'success',
    message: 'Token is valid'
  });
};

exports.approvePayment = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate receipt
    const receiptUrl = await generateReceipt(user);

    // Update user payment status
    user.paymentStatus = 'confirmed';
    await user.save();

    // Send confirmation email
    await sendEmail({
      email: user.email,
      subject: 'Payment Confirmed - StarGym Membership',
      html: createPaymentConfirmationEmail(user, receiptUrl)
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment approved successfully',
      receiptUrl
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error approving payment'
    });
  }
}; 