const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchShopifyCustomers } = require("../services/shopify.service");

// POST /customers/sync
exports.syncCustomers = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const shopUrl = process.env.SHOP_URL;
    const token = process.env.SHOPIFY_API_TOKEN;

    if (!shopUrl || !token) {
      return res.status(400).json({ message: "Shop URL or API token missing" });
    }

    const customers = await fetchShopifyCustomers(shopUrl, token);

    for (const c of customers) {
      await prisma.customer.upsert({
        where: { shopifyId: String(c.id) },
        update: {
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          phone: c.phone,
          tenantId,
        },
        create: {
          tenantId,
          shopifyId: String(c.id),
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          phone: c.phone,
        },
      });
    }

    res.json({
      message: "Customers synced successfully",
      count: customers.length,
    });
  } catch (err) {
    console.error("Customer sync error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Failed to sync customers" });
  }
};
