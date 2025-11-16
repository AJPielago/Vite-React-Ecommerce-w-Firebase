const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  productPhotoUpload
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/category/:category', getProductsByCategory);

// Protected routes (require authentication and authorization)
router.use(protect);

// Admin routes
router.use(authorize('admin'));
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.put('/:id/photo', productPhotoUpload);

module.exports = router;
