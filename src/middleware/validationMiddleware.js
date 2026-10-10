const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const productFields = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const requiredProductFields = new Set(productFields);

function validateProductInput(req, res, next) {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') {
    return next(new AppError('Request body must be a JSON object', 400));
  }

  const unknownFields = Object.keys(req.body).filter((field) => !productFields.includes(field));
  if (unknownFields.length) {
    return next(new AppError(`Unknown product field(s): ${unknownFields.join(', ')}`, 400));
  }

  if (req.method === 'POST') {
    const missingFields = [...requiredProductFields].filter(
      (field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '',
    );
    if (missingFields.length) {
      return next(new AppError(`Missing required field(s): ${missingFields.join(', ')}`, 400));
    }
  }

  return next();
}

function validateStockChange(req, res, next) {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') {
    return next(new AppError('Request body must be a JSON object', 400));
  }

  if (Object.keys(req.body).length !== 1 || !Object.hasOwn(req.body, 'change')) {
    return next(new AppError('Stock adjustment requires exactly one field: change', 400));
  }

  const { change } = req.body;
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return next(new AppError('change must be a non-zero whole number', 400));
  }

  return next();
}

function validateObjectId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return next(new AppError('Invalid product ID', 400));
  }
  return next();
}

module.exports = { validateProductInput, validateStockChange, validateObjectId };
