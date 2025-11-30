const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {
  fetchShopifyProducts,
  fetchShopifyCustomers,
  fetchShopifyOrders,
} = require("../services/shopify.service");

// GET /shopify/products
exports.getProducts = async (req, res) => {
  try {
    const tenantId = req.tenantId; // from auth middleware

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const products = await fetchShopifyProducts(tenant.shopUrl, tenant.apiToken);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /shopify/customers
exports.getCustomers = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const customers = await fetchShopifyCustomers(tenant.shopUrl, tenant.apiToken);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /shopify/orders
exports.getOrders = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const orders = await fetchShopifyOrders(tenant.shopUrl, tenant.apiToken);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
