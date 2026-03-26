import { z } from "zod";

export const PreferenceSchema = z.object({
  risk: z.enum(["low", "medium", "high"]),
  durationMonths: z.number().int().min(1).max(120),
  targetYield: z.number().min(0).max(100),
  assetTypes: z.array(z.enum(["real_estate", "art"])).min(1)
});

export const RecommendationItemSchema = z.object({
  tokenId: z.union([z.literal(1), z.literal(2)]),
  fractionAmount: z.number().int().positive(),
  score: z.number().min(0).max(1),
  predictedYieldMin: z.number().min(0).max(100),
  predictedYieldMax: z.number().min(0).max(100),
  reason: z.string().min(2)
});

export const RecommendationResponseSchema = z.object({
  model: z.string(),
  recommendations: z.array(RecommendationItemSchema).min(1),
  riskDisclosure: z.string()
});

export type PreferenceInput = z.infer<typeof PreferenceSchema>;
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
