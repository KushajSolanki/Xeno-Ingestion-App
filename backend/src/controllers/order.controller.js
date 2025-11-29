const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchShopifyOrders } = require("../services/shopify.service");

exports.syncOrders = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const shopUrl = process.env.SHOP_URL;
    const token = process.env.SHOPIFY_API_TOKEN;

    const orders = await fetchShopifyOrders(shopUrl, token);

    for (const o of orders) {
      const orderRecord = await prisma.order.upsert({
        where: { shopifyId: String(o.id) },
        update: {
          totalPrice: parseFloat(o.total_price || 0),
          currency: o.currency,
          tenantId
        },
        create: {
          tenantId,
          shopifyId: String(o.id),
          totalPrice: parseFloat(o.total_price || 0),
          currency: o.currency
        }
      });

      // Insert line items
      for (const item of o.line_items) {
        await prisma.orderItem.create({
          data: {
            orderId: orderRecord.id,
            title: item.title,
            quantity: item.quantity,
            price: parseFloat(item.price || 0)
          }
        });
      }
    }

    res.json({
      message: "Orders synced successfully",
      count: orders.length
    });

  } catch (err) {
    console.error("Order sync error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to sync orders" });
  }
};
