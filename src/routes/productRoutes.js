const express = require('express');
const {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStock,
  getCategorySummary,
} = require('../controllers/productController');
const {
  validateProductInput,
  validateStockChange,
  validateObjectId,
} = require('../middleware/validationMiddleware');

const router = express.Router();

router.route('/').get(getProducts).post(validateProductInput, createProduct);
router.get('/low-stock', getLowStock);
router.get('/summary', getCategorySummary);
router.patch('/:id/stock', validateObjectId, validateStockChange, adjustStock);
router
  .route('/:id')
  .get(validateObjectId, getProductById)
  .put(validateObjectId, validateProductInput, updateProduct)
  .delete(validateObjectId, deleteProduct);

module.exports = router;
