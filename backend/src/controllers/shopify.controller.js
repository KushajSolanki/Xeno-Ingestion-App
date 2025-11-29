const crypto = require("crypto");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_SECRET = process.env.SHOPIFY_SECRET;
const APP_URL = process.env.APP_URL; // example: https://xeno-ingestion-app.onrender.com

exports.install = async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) return res.status(400).json({ error: "Missing shop parameter" });

    const state = crypto.randomBytes(16).toString("hex");

    const redirectUri = `${APP_URL}/shopify/callback`;

    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=read_products,read_orders,read_customers&redirect_uri=${redirectUri}&state=${state}`;

    return res.json({ authUrl: installUrl });
  } catch (err) {
    console.error("Install error:", err);
    res.status(500).json({ error: "OAuth install failed" });
  }
};

exports.callback = async (req, res) => {
  try {
    const { shop, code } = req.query;

    const tokenRes = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_SECRET,
        code,
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Store the shop + token into Tenant table
    await prisma.tenant.upsert({
      where: { shopUrl: shop },
      update: { apiToken: accessToken },
      create: {
        name: shop,
        email: `${shop}@shopify.com`,
        password: "oauth",
        shopUrl: shop,
        apiToken: accessToken,
      },
    });

    return res.redirect("http://localhost:5173/dashboard");
  } catch (err) {
    console.error("Callback error:", err?.response?.data || err.message);
    res.status(500).json({ error: "OAuth callback failed" });
  }
};

exports.summary = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const products = await prisma.product.count({ where: { tenantId } });
    const orders = await prisma.order.count({ where: { tenantId } });
    const customers = await prisma.customer.count({ where: { tenantId } });

    return res.json({ products, orders, customers });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
};
