/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface AiYieldEstimateRequest {
  cropType: string;
  fieldSize: number;
  unit: "acres" | "gunthas" | "hectares";
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
  locale?: string;
}

export interface AiYieldEstimateResponse {
  estimatedYield: number; // in metric tons
  unit: "tons";
  note: string;
}

export interface MarketPrice {
  crop: string;
  market: string; // mandi name
  state: string;
  date: string; // ISO date
  unit: string; // e.g., Rs/quintal
  min: number;
  max: number;
  modal: number;
}

export interface MarketPricesResponse {
  query: string;
  items: MarketPrice[];
}
