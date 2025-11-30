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
    // ✅ Ensure tenantId comes from auth middleware
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(400).json({ message: "Tenant not identified" });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const shopifyOrders = await fetchShopifyOrders(tenant.shopUrl, tenant.apiToken);
    console.log("Fetched orders from Shopify:", shopifyOrders.length);

    for (const o of shopifyOrders) {
      // -------------------------
      // Upsert customer if present
      // -------------------------
      let customerId = null;
      if (o.customer) {
        const customer = await prisma.customer.upsert({
          where: { shopifyId: String(o.customer.id) },
          update: {
            tenantId,
            email: o.customer.email,
            firstName: o.customer.first_name,
            lastName: o.customer.last_name,
            phone: o.customer.phone,
          },
          create: {
            tenantId,
            shopifyId: String(o.customer.id),
            email: o.customer.email,
            firstName: o.customer.first_name,
            lastName: o.customer.last_name,
            phone: o.customer.phone,
          },
        });
        customerId = customer.id;
      }

      // -------------------------
      // Upsert order
      // -------------------------
      const order = await prisma.order.upsert({
        where: { shopifyId: String(o.id) },
        update: {
          totalPrice: parseFloat(o.total_price || "0"),
          tenantId,
          createdAt: new Date(o.created_at),
          customerId,
        },
        create: {
          tenantId,
          shopifyId: String(o.id),
          totalPrice: parseFloat(o.total_price || "0"),
          createdAt: new Date(o.created_at),
          customerId,
        },
      });

      // -------------------------
      // Reset order items
      // -------------------------
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

      for (const item of o.line_items || []) {
        let productId = null;

        if (item.product_id) {
          const product = await prisma.product.findUnique({
            where: { shopifyId: String(item.product_id) },
          });
          if (product) productId = product.id;
        }

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            title: item.title,
            quantity: item.quantity,
            price: parseFloat(item.price || "0"),
            productId, // ✅ only sets if product exists
          },
        });
      }
    }

    res.json({ message: "Orders synced", count: shopifyOrders.length });
  } catch (err) {
    console.error("syncOrders error:", err);
    res.status(500).json({ message: "Failed to sync orders", error: err.message });
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



