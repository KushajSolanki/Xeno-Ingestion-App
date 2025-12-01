# Xeno Ingestion App

A multi-tenant Shopify ingestion system using **Node.js (Render)**, **PostgreSQL (Railway)**, **Prisma ORM**, and **React (Vite)**.

### 👉 Try the Xeno App  
Sign up here: **[Xeno Signup](https://xeno-app-data-integration.netlify.app/signup)**  

![Xeno_Signup](./xenopic.png)

![Xeno App](./xenopic2.png)

---

# Backend Setup

cd backend
npm install

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"  # Railway PostgreSQL
SHOPIFY_API_KEY="your-key"
SHOPIFY_API_SECRET="your-secret"
APP_URL="https://your-render-backend"
FRONTEND_URL="http://localhost:5173"


npx prisma generate
npx prisma migrate deploy


VITE_BACKEND_URL="https://your-render-backend"

npm run dev

# Architecture Diagram

                 ┌──────────────────────────┐
                 │      Shopify Store        │
                 │ (Products, Orders, Cust)  │
                 └─────────────┬────────────┘
                               │ OAuth + Webhooks
                               ▼
                     ┌────────────────────────┐
                     │ Backend (Render)       │
                     │ Node.js + Prisma ORM   │
                     └─────────┬──────────────┘
                               │ DB Writes
                               ▼
                    ┌────────────────────────┐
                    │ Railway PostgreSQL      │
                    │ Multi-tenant Tables     │
                    └─────────┬──────────────┘
                              │ REST API JSON
                              ▼
                     ┌────────────────────────┐
                     │ Frontend (Vite + React)│
                     └────────────────────────┘

  # Schema

  model Shop {
  id          String    @id @default(uuid())
  shopDomain  String    @unique
  accessToken String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  products    Product[]
  orders      Order[]
  customers   Customer[]
}

model Product {
  id        String   @id @default(uuid())
  shopId    String
  title     String
  price     Float
  createdAt DateTime @default(now())
  Shop      Shop     @relation(fields: [shopId], references: [id])
}

model Order {
  id        String   @id @default(uuid())
  shopId    String
  total     Float
  createdAt DateTime @default(now())
  Shop      Shop     @relation(fields: [shopId], references: [id])
}

model Customer {
  id        String   @id @default(uuid())
  shopId    String
  name      String
  email     String
  createdAt DateTime @default(now())
  Shop      Shop     @relation(fields: [shopId], references: [id])
}


# ⚠️ Known Limitations & Assumptions

1. **Railway PostgreSQL Free Tier**
   - Database may sleep when idle  
   - Causes cold-start delays and connection resets  

2. **Shopify API Rate Limits**
   - Heavy stores (10k+ products/orders) may experience slow ingestion  
   - Requires a queue system (Redis/BullMQ) for scaling, not implemented yet  

3. **Webhook Reliability**
   - Shopify webhooks depend on Shopify’s retry logic  
   - Missing retries may cause unsynced events  

4. **No Background Workers**
   - Long-running ingestion tasks are handled directly by the backend  
   - No dedicated worker/service for async jobs  

5. **Multi-Tenant Scaling**
   - More stores = more DB reads/writes  
   - Railway DB upgrade required for production-level scaling  

6. **No Admin Dashboard**
   - Stores, tokens, logs, and errors cannot be visually managed yet  

7. **Assumption: Single Shopify App**
   - System assumes all merchants authenticate with the same Shopify app credentials  

8. **Assumption: Stable Redirect URLs**
   - OAuth redirect URL must remain constant (Render URL changes break auth)  

9. **Assumption: Correct Store Permissions**
   - App requires `read_products, read_orders, read_customers` scopes  
   - Missing scopes lead to partial ingestion  

10. **Assumption: Frontend & Backend Are Synced**
   - Frontend expects backend routes exactly as defined  
   - Breaking route changes require updating the React client  


![Xeno App](./xenopic3.png)

![Xeno App](./xenopic4.png)

![Xeno App](./xenopic5.png)

