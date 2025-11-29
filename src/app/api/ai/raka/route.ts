"use server";

import { NextResponse } from "next/server";
import { siteConfig, getApiStatus } from "@/settings/config";
import { RakaAi } from "@/lib/raka";
import { appendLog } from '@/lib/filelogger'

export async function POST(request: Request) {
  const start = Date.now()
  const urlObj = new URL(request.url)
  const fullPath = urlObj.pathname + (urlObj.search || '')
  const method = 'POST'
  const apiStatus = getApiStatus("/api/ai/raka");

  if (apiStatus.status === "offline") {
    return new NextResponse(
      JSON.stringify(
        {
          status: false,
          creator: siteConfig.api.creator,
          error: "This API endpoint is currently offline and unavailable. Please try again later.",
          endpoint: "/api/ai/raka",
          apiStatus: "offline",
          version: "v1",
        },
        null,
        2,
      ),
      {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }

  if (siteConfig.maintenance.enabled) {
    return new NextResponse(
      JSON.stringify(
        {
          status: siteConfig.maintenance.apiResponse.status,
          creator: siteConfig.api.creator,
          message: siteConfig.maintenance.apiResponse.message,
        },
        null,
        2,
      ),
      {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ status: false, creator: siteConfig.api.creator, error: "Invalid JSON in request body" }, null, 2),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const text = body?.text ?? body?.message ?? body?.question ?? body?.prompt;

  if (!text || typeof text !== "string") {
    return new NextResponse(
      JSON.stringify({ status: false, creator: siteConfig.api.creator, error: "Text (text|message|prompt) is required" }, null, 2),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  try {
    const result = await RakaAi(text);
    const resp = new NextResponse(
      JSON.stringify({ status: true, creator: siteConfig.api.creator, result, version: "v1" }, null, 2),
      { headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return resp
  } catch (error) {
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
    return new NextResponse(
      JSON.stringify({ status: false, creator: siteConfig.api.creator, error: error instanceof Error ? error.message : "External API error" }, null, 2),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}

export async function GET() {
  const start = Date.now()
  const fullPath = '/api/ai/raka'
  const method = 'GET'
  const apiStatus = getApiStatus("/api/ai/raka");

  if (apiStatus.status === "offline") {
    await appendLog({ method, path: fullPath, status: 503, responseTimeMs: Date.now() - start }).catch(()=>{})
    return new NextResponse(
      JSON.stringify({ status: false, creator: siteConfig.api.creator, error: "This API endpoint is currently offline.", endpoint: "/api/ai/raka", apiStatus: "offline", version: "v1" }, null, 2),
      { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
  return new NextResponse(
    JSON.stringify({ status: true, creator: siteConfig.api.creator, message: "Raka AI endpoint", apiStatus: apiStatus.status, version: "v1" }, null, 2),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
}
