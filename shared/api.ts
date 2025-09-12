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
  locale?: "en" | "bn";
}

export interface AiYieldEstimateResponse {
  estimatedYield: number; // in metric tons
  unit: "tons";
  note: string;
}
