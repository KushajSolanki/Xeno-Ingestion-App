const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /shopify/summary
exports.summary = async (req, res) => {
  try {
    const tenantId = req.tenantId; // from auth middleware

    const products = await prisma.product.count({ where: { tenantId } });
    const orders = await prisma.order.count({ where: { tenantId } });
    const customers = await prisma.customer.count({ where: { tenantId } });

    res.json({ products, orders, customers });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Failed to load summary" });
  }
};
