// middleware/uploadMiddleware.js
// Multer configuration for file uploads

import multer from 'multer';
import path from 'path';

// Configure multer to use memory storage (buffer)
// This allows us to upload directly to Cloudinary without saving to disk
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

// Middleware for single image upload
export const uploadSingleImage = (fieldName) => upload.single(fieldName);

// Middleware for multiple images
export const uploadMultipleImages = (fieldName, maxCount = 10) => 
  upload.array(fieldName, maxCount);

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error.',
    });
  }
  next();
};

export default {
  uploadSingleImage,
  uploadMultipleImages,
  handleUploadError,
};
