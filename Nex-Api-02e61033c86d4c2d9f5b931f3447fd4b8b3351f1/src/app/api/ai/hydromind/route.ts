'use server';

import { NextResponse } from "next/server"
import { siteConfig, getApiStatus } from "@/settings/config"

const API_TIMEOUT = 10000

async function hydromind(content: string, model: string, responses?: number) {
  try {
    const formData = new FormData()
    formData.append("content", content)
    formData.append("model", model)

    if (responses) {
      formData.append("responses", responses.toString())
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const response = await fetch("https://mind.hydrooo.web.id/v1/chat/", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${responseText}`)
      }

      try {
        const data = JSON.parse(responseText)
        return data
      } catch (parseError) {
        const result = responseText.trim()
        return {
          result,
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("External API request timed out after 10 seconds")
      }
      throw error as Error
    }
  } catch (error) {
    console.error("Hydromind API error:", error)
    throw error
  }
}

export async function POST(request: Request) {
  const apiStatus = getApiStatus("/ai/hydromind")

  if (apiStatus.status === "offline") {
    return new NextResponse(
      JSON.stringify(
        {
          status: false,
          creator: siteConfig.api.creator,
          error: "This API endpoint is currently offline and unavailable. Please try again later.",
          endpoint: "/ai/hydromind",
          apiStatus: "offline",
          version: "v1",
        },
        null,
        2,
      ),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    )
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
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    )
  }

  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      return new NextResponse(
        JSON.stringify(
          {
            status: false,
            creator: siteConfig.api.creator,
            error: "Invalid JSON in request body",
          },
          null,
          2,
        ),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      )
    }

    const { text, model, responses } = body

    if (!text || !model) {
      return new NextResponse(
        JSON.stringify(
          {
            status: false,
            creator: siteConfig.api.creator,
            error: "Text and Model are required",
          },
          null,
          2,
        ),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      )
    }

    try {
      const data = await hydromind(text, model, responses ? Number(responses) : undefined)

      return new NextResponse(
        JSON.stringify(
          {
            status: true,
            creator: siteConfig.api.creator,
            result: data.result,
            version: "v1",
          },
          null,
          2,
        ),
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) {
        return new NextResponse(
          JSON.stringify(
            {
              status: false,
              creator: siteConfig.api.creator,
              error: "Request to external API timed out. Try a simpler prompt or try again later.",
            },
            null,
            2,
          ),
          {
            status: 504,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
          },
        )
      }

      return new NextResponse(
        JSON.stringify(
          {
            status: false,
            creator: siteConfig.api.creator,
            error: error instanceof Error ? error.message : "External API error",
          },
          null,
          2,
        ),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      )
    }
  } catch (error) {
    console.error("Unhandled error in hydromind route:", error)
    return new NextResponse(
      JSON.stringify(
        {
          status: false,
          creator: siteConfig.api.creator,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    )
  }
}

export async function GET() {
  const apiStatus = getApiStatus("/ai/hydromind")

  if (apiStatus.status === "offline") {
    return new NextResponse(
      JSON.stringify(
        {
          status: false,
          creator: siteConfig.api.creator,
          error: "This API endpoint is currently offline and unavailable. Please try again later.",
          endpoint: "/ai/hydromind",
          apiStatus: "offline",
          version: "v1",
        },
        null,
        2,
      ),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    )
  }

  return new NextResponse(
    JSON.stringify(
      {
        status: true,
        creator: siteConfig.api.creator,
        message: "HydroMind API endpoint",
        apiStatus: apiStatus.status,
        version: "v1",
      },
      null,
      2,
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  )
}
