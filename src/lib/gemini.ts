const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export type GeminiMessage = {
  role: "user" | "model";
  content: string;
};

type GenerateTextOptions = {
  system?: string;
  messages: GeminiMessage[];
  maxOutputTokens?: number;
  temperature?: number;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
};

export async function generateGeminiText({
  system,
  messages,
  maxOutputTokens = 1000,
  temperature = 0.2,
}: GenerateTextOptions) {
  const apiKey = requiredEnv("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: system
          ? {
              parts: [{ text: system }],
            }
          : undefined,
        contents: messages.map((message) => ({
          role: message.role,
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          maxOutputTokens,
          temperature,
        },
      }),
    },
  );

  const data = (await response.json()) as GeminiGenerateContentResponse;

  if (!response.ok) {
    throw new Error(
      `Gemini request failed: ${response.status} ${
        data.error?.message ?? JSON.stringify(data)
      }`,
    );
  }

  const text = data.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    const blockReason = data.promptFeedback?.blockReason;
    const finishReason = data.candidates?.[0]?.finishReason;
    throw new Error(
      `Gemini returned an empty response${
        blockReason || finishReason
          ? ` (${blockReason ?? finishReason})`
          : ""
      }.`,
    );
  }

  return text;
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
