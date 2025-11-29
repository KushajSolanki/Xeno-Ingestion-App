const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopify.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Dashboard summary (uses DB)
router.get("/summary", authMiddleware, shopifyController.summary);

// (optional) product sync if you have it later
// router.post("/sync/products", authMiddleware, shopifyController.syncProducts);

module.exports = router;
