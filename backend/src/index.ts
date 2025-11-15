import "express-async-errors";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

// Routes
import userRoutes from "./routes/users";
import buyOfferRoutes from "./routes/buyOffers";
import sellOfferRoutes from "./routes/sellOffers";
import manualBuyRoutes from "./routes/manualBuys";
import shopPurchaseRoutes from "./routes/shopPurchases";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Export Prisma client as singleton
export const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/get_user", userRoutes);
app.use("/api/buy-offers", buyOfferRoutes);
app.use("/api/sell-offers", sellOfferRoutes);
app.use("/api/manual-buys", manualBuyRoutes);
app.use("/api/shop-purchases", shopPurchaseRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});
