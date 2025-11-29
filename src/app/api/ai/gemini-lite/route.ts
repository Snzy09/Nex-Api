"use server";

import { NextResponse } from "next/server";
import { siteConfig, getApiStatus } from "@/settings/config";
import AiGeminiLite from "@/lib/gemini";

export async function POST(request: Request) {
  const apiStatus = getApiStatus("/api/ai/gemini-lite");

  if (apiStatus.status === "offline") {
    return new NextResponse(
      JSON.stringify({ status: false, creator: siteConfig.api.creator, error: "This API endpoint is currently offline.", endpoint: "/api/ai/gemini-lite", apiStatus: "offline", version: "v1" }, null, 2),
      { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  if (siteConfig.maintenance.enabled) {
    return new NextResponse(
      JSON.stringify({ status: siteConfig.maintenance.apiResponse.status, creator: siteConfig.api.creator, message: siteConfig.maintenance.apiResponse.message }, null, 2),
      { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return new NextResponse(JSON.stringify({ status: false, creator: siteConfig.api.creator, error: "Invalid JSON in request body" }, null, 2), { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }

  const prompt = body?.text ?? body?.message ?? body?.prompt
  const model = body?.model
  const imgUrl = body?.imgUrl

  if (!prompt || typeof prompt !== "string") {
    return new NextResponse(JSON.stringify({ status: false, creator: siteConfig.api.creator, error: "Text (text|message|prompt) is required" }, null, 2), { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }

  try {
    const result = await AiGeminiLite(prompt, { model, imgUrl })
    return new NextResponse(JSON.stringify({ status: result.status, creator: siteConfig.api.creator, result }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } })
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ status: false, creator: siteConfig.api.creator, error: error?.message ?? 'External API error' }, null, 2), { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } })
  }
}

export async function GET() {
  const apiStatus = getApiStatus("/api/ai/gemini-lite");

  if (apiStatus.status === "offline") {
    return new NextResponse(JSON.stringify({ status: false, creator: siteConfig.api.creator, error: "This API endpoint is currently offline.", endpoint: "/api/ai/gemini-lite", apiStatus: "offline", version: "v1" }, null, 2), { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }

  return new NextResponse(JSON.stringify({ status: true, creator: siteConfig.api.creator, message: "Gemini Lite endpoint", apiStatus: apiStatus.status, version: "v1" }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } })
}
