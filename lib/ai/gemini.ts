// Server-only: reads GEMINI_API_KEY, so import this from server actions / route handlers only.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function getGeminiEnv() {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  return { apiKey, model, configured: Boolean(apiKey) };
}

/** Calls generateContent with a JSON schema and returns the parsed object. */
export async function generateJson<T>(input: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const { apiKey, model, configured } = getGeminiEnv();
  if (!configured) throw new Error("gemini_not_configured");

  const response = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: "user", parts: [{ text: input.prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseJsonSchema: input.schema,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`gemini_http_${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("") ?? "";
  if (!text) throw new Error("gemini_empty_response");
  return JSON.parse(text) as T;
}
