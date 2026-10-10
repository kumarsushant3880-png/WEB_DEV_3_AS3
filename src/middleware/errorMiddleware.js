function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errors;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(error.errors).map((item) => item.message);
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  } else if (error.code === 11000) {
    statusCode = 409;
    message = `${Object.keys(error.keyValue)[0]} must be unique`;
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON request body';
  }

  const response = { message };
  if (errors) response.errors = errors;
  if (process.env.NODE_ENV === 'development' && statusCode === 500) response.stack = error.stack;

  res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
