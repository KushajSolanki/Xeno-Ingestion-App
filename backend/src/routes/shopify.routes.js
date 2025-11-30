const express = require("express");
const {
  getProducts,
  getOrders,
  getCustomers,
  getSummary,
} = require("../controllers/shopify.controller");

const router = express.Router();

router.get("/products", getProducts);
router.get("/orders", getOrders);
router.get("/customers", getCustomers);
router.get("/summary", getSummary);

module.exports = router;
