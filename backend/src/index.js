const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


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
    // Drop child table FIRST (because of FK)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "OrderItem"`);

    // Drop parent table
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Order"`);

    res.send("Order and OrderItem tables dropped.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});


app.get("/fix-migration", async (req, res) => {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" 
      (migration_name, started_at, applied_at, checksum, logs, rolled_back_at, finished_at)
      VALUES 
      ('000_init_baseline', NOW(), NOW(), '', '', NULL, NOW());
    `);

    res.send("Baseline migration marked as applied.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error marking migration.");
  }
});



app.get("/reset-migrations-table", async (req, res) => {
  try {
    // Drop broken table
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "_prisma_migrations";`);

    // Recreate correct Prisma migrations table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "_prisma_migrations" (
        id TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        finished_at TIMESTAMP,
        migration_name TEXT NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMP,
        started_at TIMESTAMP,
        applied_at TIMESTAMP
      );
    `);

    // Insert baseline as applied
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_at
      ) VALUES (
        gen_random_uuid(),
        '',
        NOW(),
        '000_init_baseline',
        '',
        NULL,
        NOW(),
        NOW()
      );
    `);

    res.send("Prisma migrations table fully reset and baseline applied.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error resetting migrations table.");
  }
});

app.get("/create-order-tables", async (req, res) => {
  try {
    // Create Order table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Order" (
        id SERIAL PRIMARY KEY,
        tenantId INTEGER NOT NULL,
        shopifyId TEXT NOT NULL UNIQUE,
        totalPrice DOUBLE PRECISION NOT NULL,
        createdAt TIMESTAMP NOT NULL,
        customerId INTEGER
      );
    `);

    // Create OrderItem table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderItem" (
        id SERIAL PRIMARY KEY,
        orderId INTEGER NOT NULL,
        productId INTEGER,
        title TEXT,
        quantity INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL
      );
    `);

    // Add foreign keys manually
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order"
        ADD CONSTRAINT "Order_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order"
        ADD CONSTRAINT "Order_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "OrderItem"
        ADD CONSTRAINT "OrderItem_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "OrderItem"
        ADD CONSTRAINT "OrderItem_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    res.send("Order + OrderItem tables created successfully.");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating tables.");
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
