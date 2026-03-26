import { NextResponse } from "next/server";
import {
  PreferenceSchema,
  RecommendationResponseSchema,
  type PreferenceInput
} from "@/lib/schema";

function buildFallback(preferences: PreferenceInput) {
  const baseScore = preferences.risk === "low" ? 0.86 : preferences.risk === "medium" ? 0.9 : 0.93;
  const wantsEstate = preferences.assetTypes.includes("real_estate");

  return {
    model: "fallback-local-rule-engine",
    recommendations: [
      {
        tokenId: wantsEstate ? 1 : 2,
        fractionAmount: 300,
        score: baseScore,
        predictedYieldMin: wantsEstate ? 6.8 : 8.5,
        predictedYieldMax: wantsEstate ? 9.2 : 12.4,
        reason: wantsEstate
          ? "Real estate selected and suitable for medium volatility targets."
          : "Art selected for higher growth tolerance profile."
      },
      {
        tokenId: wantsEstate ? 2 : 1,
        fractionAmount: 120,
        score: baseScore - 0.06,
        predictedYieldMin: wantsEstate ? 8.1 : 6.1,
        predictedYieldMax: wantsEstate ? 11.6 : 8.8,
        reason: "Secondary diversification option to balance concentration risk."
      }
    ],
    riskDisclosure: "This is not investment advice."
  };
}

async function callOpenModel(preferences: PreferenceInput) {
  const baseUrl = process.env.OPENMODEL_BASE_URL;
  const apiKey = process.env.OPENMODEL_API_KEY;
  const model = process.env.OPENMODEL_NAME ?? "qwen/qwen2.5-7b-instruct";
  if (!baseUrl || !apiKey) return null;

  const prompt = [
    "Return ONLY valid JSON.",
    "Schema:",
    '{"model":"string","recommendations":[{"tokenId":1|2,"fractionAmount":number,"score":0-1,"predictedYieldMin":number,"predictedYieldMax":number,"reason":"string"}],"riskDisclosure":"This is not investment advice."}',
    `User preferences: ${JSON.stringify(preferences)}`,
    "Assets: tokenId 1 is Hong Kong residential real estate, tokenId 2 is contemporary art."
  ].join("\n");

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a conservative RWA recommendation assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!resp.ok) return null;
  const payload = await resp.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    const validated = RecommendationResponseSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = PreferenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const modelResp = await callOpenModel(parsed.data);
    const data = modelResp ?? buildFallback(parsed.data);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
