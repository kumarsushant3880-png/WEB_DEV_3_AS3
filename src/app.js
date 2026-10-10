const express = require('express');
const productRoutes = require('./routes/productRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
