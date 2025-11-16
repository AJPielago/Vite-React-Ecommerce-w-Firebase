const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');

// @desc    Upload image to Cloudinary
// @route   POST /api/v1/upload
// @access  Private (any authenticated user can upload, admins get product uploads, users get profile uploads)
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload a file'
    });
  }

  // Multer-Cloudinary may expose the URL under different fields
  const file = req.file;
  const imageUrl = file.path || file.secure_url || file.url;

  return res.status(200).json({
    success: true,
    data: imageUrl
  });
});

module.exports = router;
