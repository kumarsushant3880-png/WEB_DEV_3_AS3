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

const router = express.Router();

router.route('/').get(getProducts).post(createProduct);
router.get('/low-stock', getLowStock);
router.get('/summary', getCategorySummary);
router.patch('/:id/stock', adjustStock);
router
  .route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
