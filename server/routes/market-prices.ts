import { RequestHandler } from "express";
import { MarketPricesResponse, MarketPrice } from "@shared/api";

const MOCK: MarketPrice[] = [
  { crop: "Rice", market: "Kolkata", state: "West Bengal", date: new Date().toISOString(), unit: "₹/quintal", min: 2500, max: 3100, modal: 2850 },
  { crop: "Wheat", market: "Delhi", state: "Delhi", date: new Date().toISOString(), unit: "₹/quintal", min: 2100, max: 2600, modal: 2350 },
  { crop: "Maize", market: "Hyderabad", state: "Telangana", date: new Date().toISOString(), unit: "₹/quintal", min: 1900, max: 2300, modal: 2100 },
  { crop: "Rice", market: "Patna", state: "Bihar", date: new Date().toISOString(), unit: "₹/quintal", min: 2400, max: 3000, modal: 2750 },
  { crop: "Rice", market: "Guwahati", state: "Assam", date: new Date().toISOString(), unit: "₹/quintal", min: 2300, max: 2950, modal: 2650 },
];

export const handleMarketPrices: RequestHandler = (req, res) => {
  const q = String(req.query.query || "").toLowerCase();
  const items = MOCK.filter((it) =>
    !q || it.crop.toLowerCase().includes(q) || it.market.toLowerCase().includes(q) || it.state.toLowerCase().includes(q),
  ).slice(0, 25);

  const response: MarketPricesResponse = { query: q, items };
  res.status(200).json(response);
};
