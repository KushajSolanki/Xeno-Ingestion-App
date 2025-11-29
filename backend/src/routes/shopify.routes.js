const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopify.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protected route – requires JWT
router.post("/sync/products", authMiddleware, shopifyController.syncProducts);

module.exports = router;

