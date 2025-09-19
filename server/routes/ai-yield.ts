import { RequestHandler } from "express";
import { AiYieldEstimateRequest, AiYieldEstimateResponse } from "@shared/api";

// Simple placeholder calculation: base yield per hectare * area in hectares
const BASE_YIELD_T_PER_HA: Record<string, number> = {
  rice: 4.5,
  wheat: 3.5,
  maize: 5.0,
  others: 3.0,
};

function toHectares(
  size: number,
  unit: AiYieldEstimateRequest["unit"],
): number {
  if (!isFinite(size) || size <= 0) return 0;
  switch (unit) {
    case "hectares":
      return size;
    case "acres":
      return size * 0.4046856422;
    case "gunthas":
      return size * (0.4046856422 / 40); // 40 gunthas ≈ 1 acre
    default:
      return 0;
  }
}

export const handleAiYield: RequestHandler = async (req, res) => {
  const body = req.body as AiYieldEstimateRequest;

  const external = process.env.MODEL_API_URL;
  if (external) {
    try {
      const ctl = new AbortController();
      const id = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(external, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      clearTimeout(id);
      if (r.ok) {
        const data = (await r.json()) as Partial<AiYieldEstimateResponse> & {
          estimated_yield?: number;
        };
        const estimatedYield =
          typeof data.estimatedYield === "number"
            ? data.estimatedYield
            : typeof (data as any).prediction === "number"
              ? (data as any).prediction
              : typeof data.estimated_yield === "number"
                ? data.estimated_yield
                : undefined;
        if (typeof estimatedYield === "number") {
          const resp: AiYieldEstimateResponse = {
            estimatedYield,
            unit: (data.unit as any) || "tons",
            note: data.note || "Prediction from external model",
          };
          return res.status(200).json(resp);
        }
      }
    } catch (e) {
      // fall through to demo logic
    }
  }

  const areaHa = toHectares(Number(body.fieldSize), body.unit);
  const base = BASE_YIELD_T_PER_HA[body.cropType] ?? BASE_YIELD_T_PER_HA.others;
  const locBoost =
    body.location?.latitude && body.location?.longitude ? 1.03 : 1.0;
  const estimatedYield = Math.max(0, areaHa * base * locBoost);

  const note =
    body.locale === "bn"
      ? "এটি একটি ডেমো ফলাফল। প্রকৃত AI মডেল যুক্ত হলে আরও নির্ভুল হবে।"
      : "This is a demo result. Accuracy will improve when the real AI model is connected.";

  const response: AiYieldEstimateResponse = {
    estimatedYield,
    unit: "tons",
    note,
  };

  res.status(200).json(response);
};
