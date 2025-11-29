const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchShopifyOrders } = require("../services/shopify.service");

// POST /orders/sync
exports.syncOrders = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const shopUrl = process.env.SHOP_URL;
    const token = process.env.SHOPIFY_API_TOKEN;

    if (!shopUrl || !token) {
      return res.status(400).json({ message: "Shop URL or API token missing" });
    }

    const orders = await fetchShopifyOrders(shopUrl, token);

    for (const o of orders) {
      // link customer if present
      let customerId = null;
      if (o.customer) {
        const customer = await prisma.customer.upsert({
          where: { shopifyId: String(o.customer.id) },
          update: {
            email: o.customer.email,
            firstName: o.customer.first_name,
            lastName: o.customer.last_name,
            phone: o.customer.phone,
            tenantId,
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

      const orderRecord = await prisma.order.upsert({
        where: { shopifyId: String(o.id) },
        update: {
          totalAmount: parseFloat(o.total_price || 0),
          date: new Date(o.created_at),
          tenantId,
          customerId,
        },
        create: {
          tenantId,
          shopifyId: String(o.id),
          totalAmount: parseFloat(o.total_price || 0),
          date: new Date(o.created_at),
          customerId,
        },
      });

      // clear previous items and re-insert (simple approach)
      await prisma.orderItem.deleteMany({
        where: { orderId: orderRecord.id },
      });

      for (const item of o.line_items || []) {
        // ensure product exists
        const prodShopifyId = String(item.product_id || item.id);
        const product = await prisma.product.upsert({
          where: { shopifyId: prodShopifyId },
          update: {
            title: item.title,
            price: parseFloat(item.price || 0),
            tenantId,
          },
          create: {
            tenantId,
            shopifyId: prodShopifyId,
            title: item.title,
            price: parseFloat(item.price || 0),
          },
        });

        await prisma.orderItem.create({
          data: {
            orderId: orderRecord.id,
            productId: product.id,
            quantity: item.quantity,
            price: parseFloat(item.price || 0),
          },
        });
      }
    }

    res.json({
      message: "Orders synced successfully",
      count: orders.length,
    });
  } catch (err) {
    console.error("Order sync error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Failed to sync orders" });
  }
};


// GET /orders/trend
exports.getOrderTrend = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // fetch orders for this tenant
    const orders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: { date: "asc" },
    });

    // group by weekday
    const trend = {};

    for (const o of orders) {
      const day = o.date.toLocaleDateString("en-US", {
        weekday: "short",
      });

      if (!trend[day]) trend[day] = 0;
      trend[day]++;
    }

    // convert to array response
    const data = Object.keys(trend).map((day) => ({
      date: day,
      orders: trend[day],
    }));

    res.json(data);
  } catch (err) {
    console.error("Order trend error:", err);
    res.status(500).json({ message: "Failed to fetch order trend" });
  }
};

