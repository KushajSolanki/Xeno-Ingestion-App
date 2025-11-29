const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middleware/auth.middleware");

// POST /orders/sync
router.post("/sync", authMiddleware, orderController.syncOrders);

// GET /orders/trend (NEW)
router.get("/trend", authMiddleware, orderController.getOrderTrend);

module.exports = router;
