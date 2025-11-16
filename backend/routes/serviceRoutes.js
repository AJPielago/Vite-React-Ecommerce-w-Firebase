const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const { auth, admin } = require('../middleware/auth');
const serviceController = require('../controllers/serviceController');

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image file (jpg, jpeg, png)'));
    }
    cb(undefined, true);
  }
});

// @route   POST /api/services
// @desc    Create a new service
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    admin,
    upload.array('images', 5), // Max 5 images
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('price', 'Please include a valid price').isNumeric(),
      check('duration', 'Please include a valid duration in minutes').isInt({ min: 1 })
    ]
  ],
  serviceController.createService
);

// @route   GET /api/services
// @desc    Get all services with pagination and search
// @access  Public
router.get('/', serviceController.getServices);

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', serviceController.getServiceById);

// @route   PUT /api/services/:id
// @desc    Update a service
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    admin,
    upload.array('images', 5), // Max 5 additional images
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('price', 'Please include a valid price').isNumeric(),
      check('duration', 'Please include a valid duration in minutes').isInt({ min: 1 })
    ]
  ],
  serviceController.updateService
);

// @route   DELETE /api/services/:id
// @desc    Delete a service
// @access  Private/Admin
router.delete('/:id', [auth, admin], serviceController.deleteService);

// @route   DELETE /api/services
// @desc    Bulk delete services
// @access  Private/Admin
router.delete('/', [auth, admin], serviceController.bulkDeleteServices);

// @route   DELETE /api/services/:serviceId/images/:imageId
// @desc    Delete a specific image from a service
// @access  Private/Admin
router.delete('/:serviceId/images/:imageId', [auth, admin], serviceController.deleteServiceImage);

module.exports = router;
