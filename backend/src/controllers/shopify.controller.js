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

// GET /shopify/summary
exports.getSummary = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const products = await prisma.product.count({ where: { tenantId } });
    const orders = await prisma.order.count({ where: { tenantId } });
    const customers = await prisma.customer.count({ where: { tenantId } });

    res.json({ products, orders, customers });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Failed to load summary" });
  }
};

exports.syncProducts = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const shopifyProducts = await fetchShopifyProducts(
      tenant.shopUrl,
      tenant.apiToken
    );

    await Promise.all(
      shopifyProducts.map((p) =>
        prisma.product.upsert({
          where: { shopifyId: String(p.id) },
          update: {
            title: p.title,
            price: parseFloat(p.variants?.[0]?.price || "0"),
            tenantId,
          },
          create: {
            tenantId,
            shopifyId: String(p.id),
            title: p.title,
            price: parseFloat(p.variants?.[0]?.price || "0"),
          },
        })
      )
    );

    res.json({ message: "Products synced", count: shopifyProducts.length });
  } catch (err) {
    console.error("syncProducts error:", err);
    res.status(500).json({ message: "Failed to sync products" });
  }
};

// POST /shopify/sync/customers
exports.syncCustomers = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const shopifyCustomers = await fetchShopifyCustomers(
      tenant.shopUrl,
      tenant.apiToken
    );

    await Promise.all(
      shopifyCustomers.map((c) =>
        prisma.customer.upsert({
          where: { shopifyId: String(c.id) },
          update: {
            tenantId,
            email: c.email,
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
          },
          create: {
            tenantId,
            shopifyId: String(c.id),
            email: c.email,
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
          },
        })
      )
    );

    res.json({ message: "Customers synced", count: shopifyCustomers.length });
  } catch (err) {
    console.error("syncCustomers error:", err);
    res.status(500).json({ message: "Failed to sync customers" });
  }
};

// POST /shopify/sync/orders
exports.syncOrders = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const shopifyOrders = await fetchShopifyOrders(
      tenant.shopUrl,
      tenant.apiToken
    );

    await Promise.all(
      shopifyOrders.map(async (o) => {
        // upsert customer (if present)
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

        // upsert order
        const order = await prisma.order.upsert({
          where: { shopifyId: String(o.id) },
          update: {
            tenantId,
            totalPrice: parseFloat(o.total_price || "0"),
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

        // clear existing items then recreate
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

        await Promise.all(
          (o.line_items || []).map((item) =>
            prisma.orderItem.create({
              data: {
                orderId: order.id,
                title: item.title,
                quantity: item.quantity,
                price: parseFloat(item.price || "0"),
                // link to product if already synced
                product: item.product_id
                  ? {
                      connect: {
                        shopifyId: String(item.product_id),
                      },
                    }
                  : undefined,
              },
            })
          )
        );
      })
    );

    res.json({ message: "Orders synced", count: shopifyOrders.length });
  } catch (err) {
    console.error("syncOrders error:", err);
    res.status(500).json({ message: "Failed to sync orders" });
  }
};

// POST /shopify/sync/all
exports.syncAll = async (req, res) => {
  try {
    await exports.syncProducts(req, res);
    await exports.syncCustomers(req, res);
    await exports.syncOrders(req, res);

    // last handler will send response, so no extra res.json here
  } catch (err) {
    console.error("syncAll error:", err);
    res.status(500).json({ message: "Failed to sync all" });
  }
};


