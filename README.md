# Inventory Data Management System

A small Node.js, Express, MongoDB, and Mongoose REST API for Assignment 3.

## Run

1. Copy `.env.example` to `.env` and add your MongoDB connection string.
2. Run `npm start`.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/products` | Create a product |
| GET | `/api/products` | List products. Supports `category`, `search`, `sort`, `page`, and `limit` |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update a product |
| PATCH | `/api/products/:id/stock` | Add or subtract stock with `{ "change": 5 }` |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/products/low-stock` | Low-stock report |
| GET | `/api/products/summary` | Category-wise inventory report |

Example product body:

```json
{
  "name": "Blue Pen",
  "sku": "PEN-001",
  "category": "Stationery",
  "price": 10,
  "quantity": 40,
  "reorderLevel": 10,
  "supplier": "ABC Suppliers"
}
```
