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

// Only the required routes
const shopifyRoutes = require("./routes/shopify.routes");
const customerRoutes = require("./routes/customer.routes");
const orderRoutes = require("./routes/order.routes");

app.use("/shopify", shopifyRoutes);
app.use("/customers", customerRoutes);
app.use("/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("Xeno Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
