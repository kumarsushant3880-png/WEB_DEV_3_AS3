const Product = require('../models/Product');

// GET /api/products?category=Stationery&search=pen&sort=price&page=1&limit=10
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, sort = 'name', page = 1, limit = 10 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sort)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    res.json({ total, page: currentPage, products });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/stock with { "change": 5 } or { "change": -2 }
exports.adjustStock = async (req, res, next) => {
  try {
    const { change } = req.body;
    if (!Number.isInteger(change) || change === 0) {
      return res.status(400).json({ message: 'change must be a non-zero whole number' });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, ...(change < 0 && { quantity: { $gte: -change } }) },
      { $inc: { quantity: change } },
      { new: true },
    );

    if (!product) return res.status(404).json({ message: 'Product not found or insufficient stock' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
      { $addFields: { stockValue: { $multiply: ['$price', '$quantity'] } } },
    ]);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

exports.getCategorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          averagePrice: { $avg: '$price' },
        },
      },
    ]);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
