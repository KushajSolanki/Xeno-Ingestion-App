const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchShopifyProducts, fetchShopifyCustomers, fetchShopifyOrders } = require("../services/shopify.service");

exports.getProducts = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const products = await fetchShopifyProducts(tenant.shopUrl, tenant.apiToken);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const customers = await fetchShopifyCustomers(tenant.shopUrl, tenant.apiToken);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const orders = await fetchShopifyOrders(tenant.shopUrl, tenant.apiToken);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Sync Products
exports.syncProducts = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const products = await fetchShopifyProducts(tenant.shopUrl, tenant.apiToken);

    for (const p of products) {
      await prisma.product.upsert({
        where: { shopifyId: String(p.id) },
        update: { title: p.title, price: parseFloat(p.variants?.[0]?.price || "0"), tenantId },
        create: { shopifyId: String(p.id), title: p.title, price: parseFloat(p.variants?.[0]?.price || "0"), tenantId },
      });
    }

    res.json({ message: "Products synced", count: products.length });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Sync Customers
exports.syncCustomers = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const customers = await fetchShopifyCustomers(tenant.shopUrl, tenant.apiToken);

    for (const c of customers) {
      await prisma.customer.upsert({
        where: { shopifyId: String(c.id) },
        update: { email: c.email, tenantId: req.tenantId },
        create: { shopifyId: String(c.id), email: c.email, tenantId: req.tenantId },
      });
    }

    res.json({ message: "Customers synced", count: customers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Sync Orders
exports.syncOrders = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const orders = await fetchShopifyOrders(tenant.shopUrl, tenant.apiToken);

    for (const o of orders) {
      const order = await prisma.order.upsert({
        where: { shopifyId: String(o.id) },
        update: { totalPrice: parseFloat(o.total_price || "0"), tenantId: req.tenantId },
        create: { shopifyId: String(o.id), totalPrice: parseFloat(o.total_price || "0"), tenantId: req.tenantId },
      });

      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

      for (const item of o.line_items || []) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            title: item.title,
            quantity: item.quantity,
            price: Number(item.price),
            productId: null,
          },
        });
      }
    }

    res.json({ message: "Orders synced", count: orders.length });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Sync All
exports.syncAll = async (req, res) => {
  try {
    await exports.syncProducts(req, { json: () => {} });
    await exports.syncCustomers(req, { json: () => {} });
    await exports.syncOrders(req, { json: () => {} });

    return res.json({ message: "All synced successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getSummary = (req, res) => {
  res.json({
    message: "Summary endpoint coming soon 🚀",
  });
};

