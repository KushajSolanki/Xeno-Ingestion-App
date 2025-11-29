const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchShopifyProducts } = require("../services/shopify.service");

// POST /shopify/sync/products
exports.syncProducts = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const shopUrl = process.env.SHOP_URL;
    const token = process.env.SHOPIFY_API_TOKEN;

    if (!shopUrl || !token) {
      return res.status(400).json({ message: "Shop URL or API token missing" });
    }

    const products = await fetchShopifyProducts(shopUrl, token);

    for (const p of products) {
      const firstVariant = p.variants && p.variants[0];
      const price = firstVariant ? parseFloat(firstVariant.price || 0) : 0;

      await prisma.product.upsert({
        where: { shopifyId: String(p.id) },
        update: {
          title: p.title,
          price,
          tenantId,
        },
        create: {
          tenantId,
          shopifyId: String(p.id),
          title: p.title,
          price,
        },
      });
    }

    res.json({
      message: "Products synced successfully",
      count: products.length,
    });
  } catch (err) {
    console.error("Shopify Product Error:", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    res.status(500).json({ message: "Failed to sync products" });
  }
};
