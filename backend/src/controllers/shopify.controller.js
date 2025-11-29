const crypto = require("crypto");
const axios = require("axios");
const prisma = require("../../prisma/client");

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_SECRET = process.env.SHOPIFY_SECRET;
const APP_URL = process.env.APP_URL; // https://xeno-ingestion-app.onrender.com

exports.install = async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).json({ error: "Missing shop parameter" });

  const state = crypto.randomBytes(16).toString("hex");

  const redirectUri = `${APP_URL}/shopify/callback`;

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=read_products,read_orders,read_customers&redirect_uri=${redirectUri}&state=${state}`;

  res.json({ authUrl: installUrl });
};

exports.callback = async (req, res) => {
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

  // Store in DB
  const store = await prisma.store.upsert({
    where: { shop },
    create: { shop, accessToken },
    update: { accessToken },
  });

  // Redirect frontend
  res.redirect("http://localhost:5173/dashboard");
};

exports.summary = async (req, res) => {
  const tenantId = req.tenantId;

  const products = await prisma.product.count({ where: { tenantId } });
  const orders = await prisma.order.count({ where: { tenantId } });
  const customers = await prisma.customer.count({ where: { tenantId } });

  res.json({
    products,
    orders,
    customers,
  });
};
