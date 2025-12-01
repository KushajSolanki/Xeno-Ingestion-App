const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();

// ✅ CORS CONFIG (add this!)
const allowedOrigins = [
  "http://localhost:5173",
  "https://xeno-app-data-integration.netlify.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());






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
