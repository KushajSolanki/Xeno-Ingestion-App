const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/sync", authMiddleware, customerController.syncCustomers);

module.exports = router;
