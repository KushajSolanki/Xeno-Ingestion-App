const axios = require("axios");

const API_VERSION = "2025-10";

async function shopifyGet(path, shopUrl, accessToken, query = "") {
  const url = `https://${shopUrl}/admin/api/${API_VERSION}/${path}.json${query}`;
  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

async function fetchShopifyProducts(shopUrl, accessToken) {
  const data = await shopifyGet("products", shopUrl, accessToken, "?limit=250");
  return data.products || [];
}

async function fetchShopifyCustomers(shopUrl, accessToken) {
  const data = await shopifyGet("customers", shopUrl, accessToken, "?limit=250");
  return data.customers || [];
}

async function fetchShopifyOrders(shopUrl, accessToken) {
  const data = await shopifyGet(
    "orders",
    shopUrl,
    accessToken,
    "?status=any&limit=250"
  );
  return data.orders || [];
}

module.exports = {
  fetchShopifyProducts,
  fetchShopifyCustomers,
  fetchShopifyOrders
};
