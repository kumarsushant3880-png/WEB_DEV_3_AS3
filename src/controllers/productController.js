const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getProducts = asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, minQuantity, maxQuantity } = req.query;
  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  addRange(filter, 'price', minPrice, maxPrice, 'price');
  addRange(filter, 'quantity', minQuantity, maxQuantity, 'quantity');

  const page = readPositiveInteger(req.query.page, 1, 'page');
  const limit = readPositiveInteger(req.query.limit, 10, 'limit', 100);
  const sort = buildSort(req.query.sort);
  const total = await Product.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const products = await Product.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({ total, page, totalPages, count: products.length, products });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json({ message: 'Product deleted', id: req.params.id });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: -change };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { returnDocument: 'after' },
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError('Insufficient stock for this adjustment', 400);
  }

  res.status(200).json({ message: 'Stock updated', product });
});

const getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    { $addFields: { stockValue: { $multiply: ['$price', '$quantity'] } } },
    { $sort: { quantity: 1, name: 1 } },
  ]);

  res.status(200).json({ count: lowStockItems.length, lowStockItems });
});

const getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({ categories: summary.length, summary });
});

function addRange(filter, field, minimum, maximum, label) {
  if (minimum === undefined && maximum === undefined) return;
  const range = {};
  if (minimum !== undefined) range.$gte = readFiniteNumber(minimum, `min${capitalize(label)}`);
  if (maximum !== undefined) range.$lte = readFiniteNumber(maximum, `max${capitalize(label)}`);
  if (range.$gte !== undefined && range.$lte !== undefined && range.$gte > range.$lte) {
    throw new AppError(`min${capitalize(label)} cannot be greater than max${capitalize(label)}`, 400);
  }
  filter[field] = range;
}

function buildSort(value) {
  if (!value) return { createdAt: -1 };
  const allowed = new Set(['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'createdAt', 'updatedAt']);
  const sort = {};
  for (const token of String(value).split(',')) {
    const field = token.startsWith('-') ? token.slice(1) : token;
    if (!allowed.has(field)) throw new AppError(`Unsupported sort field: ${field}`, 400);
    sort[field] = token.startsWith('-') ? -1 : 1;
  }
  return sort;
}

function readPositiveInteger(value, fallback, label, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new AppError(`${label} must be a whole number between 1 and ${max}`, 400);
  }
  return parsed;
}

function readFiniteNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new AppError(`${label} must be a valid number`, 400);
  return parsed;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStock,
  getCategorySummary,
};
