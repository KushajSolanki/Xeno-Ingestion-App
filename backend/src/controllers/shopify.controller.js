const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchShopifyProducts } = require("../services/shopify.service");

// POST /shopify/sync/products
exports.syncProducts = async (req, res) => {
  try {
    const tenantId = req.tenantId; // from auth middleware

    // Get tenant from DB
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const shopUrl = process.env.SHOP_URL;
    const token = process.env.SHOPIFY_API_TOKEN;

    if (!shopUrl || !token) {
      return res.status(400).json({
        message: "Shop URL or API token missing for this tenant",
      });
    }

    // Fetch products from Shopify
    const products = await fetchShopifyProducts(shopUrl, token);

    // Upsert into DB
    for (const p of products) {
      const firstVariant = p.variants && p.variants[0];
      const price = firstVariant ? parseFloat(firstVariant.price || 0) : 0;

      await prisma.product.upsert({
        where: { shopifyId: String(p.id) }, // if you want per-tenant uniqueness, change schema
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
    console.error("Shopify Error:", {
  status: err?.response?.status,
  data: err?.response?.data,
  message: err?.message
});

  }
};


