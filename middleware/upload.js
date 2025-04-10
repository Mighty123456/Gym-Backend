const multer = require('multer');
const path = require('path');

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('File upload destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize filename and ensure unique name
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const finalFilename = uniqueSuffix + '-' + sanitizedFilename;
    console.log('Generated filename:', finalFilename);
    cb(null, finalFilename);
  }
});

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Limit to 1 file per request
  },
  fileFilter: function (req, file, cb) {
    console.log('Processing file upload:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Check file size before processing
    if (file.size > MAX_FILE_SIZE) {
      console.log('File size exceeds limit:', file.size);
      return cb(new Error(`File size exceeds 2MB limit. Please upload a smaller file.`));
    }

    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      console.log('File accepted:', file.originalname);
      return cb(null, true);
    } else {
      console.log('Invalid file type:', file.originalname);
      cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
    }
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  console.error('Upload error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size too large. Maximum size is 2MB. Please upload a smaller file.'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Error uploading file'
    });
  } else if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Error uploading file'
    });
  }
  next();
};

module.exports = { upload, handleUploadError }; 