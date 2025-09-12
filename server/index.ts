import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAiYield } from "./routes/ai-yield";
import { handleMarketPrices } from "./routes/market-prices";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Placeholder AI endpoint
  app.post("/api/ai/yield", handleAiYield);

  // Market prices search (mock)
  app.get("/api/market/prices", handleMarketPrices);

  return app;
}
