"use server";

const API_TIMEOUT = 10000;

export async function RakaAi(pertanyaan: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch("https://api.reka.ai/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": "23b2fda124e5f8354860120b7f0b51bbd1b9923740e4539cc79b1f853a621a56",
      },
      body: JSON.stringify({
        model: "reka-core",
        messages: [{ role: "user", content: pertanyaan }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Raka API responded with ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data?.responses?.[0]?.message?.content;
    return typeof content === "string" ? content.trim() : "";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Raka API request timed out");
    }
    throw error as Error;
  }
}

export default RakaAi;
