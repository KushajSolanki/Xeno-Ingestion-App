const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getSummary = async (req, res) => {
  try {
    const products = await prisma.product.count();
    const orders = await prisma.order.count();
    const customers = await prisma.customer.count();

    res.json({ products, orders, customers });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Failed to load summary" });
  }
};
