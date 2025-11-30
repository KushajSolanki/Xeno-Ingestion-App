const express = require("express");
const {
  getProducts,
  getOrders,
  getCustomers,
  getSummary,
  syncProducts,
  syncCustomers,
  syncOrders,
  syncAll,
} = require("../controllers/shopify.controller");

const router = express.Router();

// live fetch from Shopify
router.get("/products", getProducts);
router.get("/orders", getOrders);
router.get("/customers", getCustomers);
router.get("/summary", getSummary);

// sync into DB
router.post("/sync/products", syncProducts);
router.post("/sync/customers", syncCustomers);
router.post("/sync/orders", syncOrders);
router.post("/sync/all", syncAll);

module.exports = router;
