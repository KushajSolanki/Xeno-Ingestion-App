const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// REGISTER ROUTES FIRST
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Xeno Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
