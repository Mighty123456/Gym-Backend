const APIError = require('../utils/APIError');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'NodemailerError') {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send email',
      error: err.message
    });
  }

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler; 