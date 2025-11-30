const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://xeno-ingestion-app.onrender.com"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.routes");
const shopifyRoutes = require("./routes/shopify.routes");
const customerRoutes = require("./routes/customer.routes");
const orderRoutes = require("./routes/order.routes");

// Import middleware
const authMiddleware = require("./middleware/auth.middleware");

// Public routes
app.use("/auth", authRoutes);

// Protected (tenant-specific) routes
app.use("/shopify", authMiddleware, shopifyRoutes);
app.use("/customers", authMiddleware, customerRoutes);
app.use("/orders", authMiddleware, orderRoutes);

app.get("/", (req, res) => {
  res.send("Xeno Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
