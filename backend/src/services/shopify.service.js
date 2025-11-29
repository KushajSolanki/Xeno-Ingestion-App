const axios = require("axios");

async function fetchShopifyProducts(shopUrl, accessToken) {
  const apiVersion = "2025-10"; // same as in your app config
  const url = `https://${shopUrl}/admin/api/${apiVersion}/products.json?limit=250`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  return res.data.products || [];
}

async function fetchShopifyCustomers(shopUrl, accessToken) {
  const apiVersion = "2025-10";
  const url = `https://${shopUrl}/admin/api/${apiVersion}/customers.json?limit=250`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  return res.data.customers || [];
}


module.exports = {
  fetchShopifyProducts,
};

