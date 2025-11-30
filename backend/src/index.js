const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://xeno-ingestion-app.onrender.com"],
    credentials: true,
  })
);

app.use(express.json());


app.get("/fix-order-table", async (req, res) => {
  try {
    await prisma.$executeRawUnsafe(`
      DROP TABLE IF EXISTS "OrderItem";
      DROP TABLE IF EXISTS "Order";
    `);

    res.send("Order and OrderItem tables dropped.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});



// Route Imports
const authRoutes = require("./routes/auth.routes");
const shopifyRoutes = require("./routes/shopify.routes");
const customerRoutes = require("./routes/customer.routes");
const orderRoutes = require("./routes/order.routes");

// Auth Middleware (protect multi-tenant routes)
const authMiddleware = require("./middleware/auth.middleware");

// Public Routes
app.use("/auth", authRoutes);

// Protected (tenant-specific) Routes
app.use("/shopify", authMiddleware, shopifyRoutes);
app.use("/customers", authMiddleware, customerRoutes);
app.use("/orders", authMiddleware, orderRoutes);

// Health Check Route
app.get("/", (req, res) => {
  res.send("Xeno Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
