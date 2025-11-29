const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchShopifyCustomers } = require("../services/shopify.service");

exports.syncCustomers = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId }
    });

    if (!tenant?.shopUrl || !tenant?.apiToken) {
      return res.status(400).json({ message: "Tenant not connected to Shopify" });
    }

    const customers = await fetchShopifyCustomers(tenant.shopUrl, tenant.apiToken);

    for (const c of customers) {
      await prisma.customer.upsert({
        where: { shopifyId: String(c.id) },
        update: {
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          phone: c.phone,
          tenantId: tenant.id,
        },
        create: {
          tenantId: tenant.id,
          shopifyId: String(c.id),
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          phone: c.phone,
        },
      });
    }

    res.json({ message: "Customers synced", count: customers.length });
  } catch (err) {
    console.error("Customer sync error:", err);
    res.status(500).json({ message: "Failed to sync customers" });
  }
};
