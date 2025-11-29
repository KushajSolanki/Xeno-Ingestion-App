const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/sync", authMiddleware, orderController.syncOrders);

module.exports = router;
