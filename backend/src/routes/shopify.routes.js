const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopify.controller");
const auth = require("../middleware/auth.middleware");

// Protected routes
router.get("/products", auth, shopifyController.getProducts);
router.get("/customers", auth, shopifyController.getCustomers);
router.get("/orders", auth, shopifyController.getOrders);
router.get("/summary", auth, shopifyController.getSummary);
router.get("/orders/trend", auth, shopifyController.getOrdersTrend);

// Sync routes
router.post("/sync/products", auth, shopifyController.syncProducts);
router.post("/sync/customers", auth, shopifyController.syncCustomers);
router.post("/sync/orders", auth, shopifyController.syncOrders);
router.post("/sync/all", auth, shopifyController.syncAll);

module.exports = router;


