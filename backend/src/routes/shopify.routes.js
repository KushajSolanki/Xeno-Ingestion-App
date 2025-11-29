const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopify.controller");
const authMiddleware = require("../middleware/auth.middleware");

// START SHOPIFY INSTALL
router.get("/install", shopifyController.install);

// OAUTH CALLBACK
router.get("/callback", shopifyController.callback);

// STORE SUMMARY (Dashboard)
router.get("/summary", authMiddleware, shopifyController.summary);

// SYNC PRODUCTS (protected)
router.post("/sync/products", authMiddleware, shopifyController.syncProducts);

module.exports = router;
