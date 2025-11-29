
const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopify.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/install", shopifyController.install);
router.get("/callback", shopifyController.callback);

router.get("/summary", authMiddleware, shopifyController.summary);
router.post("/sync/products", authMiddleware, shopifyController.syncProducts);

module.exports = router;
