const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const DEFAULT_GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

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

class GeminiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiRequestError";
  }
}

export async function generateGeminiText({
  system,
  messages,
  maxOutputTokens = 1000,
  temperature = 0.2,
}: GenerateTextOptions) {
  const apiKey = requiredEnv("GEMINI_API_KEY");
  const models = geminiModelCandidates(
    process.env.GEMINI_MODEL,
    process.env.GEMINI_FALLBACK_MODELS,
  );
  const errors: string[] = [];

  for (const [index, model] of models.entries()) {
    try {
      return await generateGeminiTextWithModel({
        apiKey,
        model,
        system,
        messages,
        maxOutputTokens,
        temperature,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${model}: ${message}`);

      if (
        index === models.length - 1 ||
        !shouldTryNextGeminiModel(error)
      ) {
        throw new Error(`Gemini request failed across models. ${errors.join(" | ")}`);
      }
    }
  }

  throw new Error("Gemini request failed: no models configured.");
}

export function geminiModelCandidates(
  primaryModel?: string,
  fallbackModels?: string,
) {
  const fallbackList = fallbackModels
    ? fallbackModels.split(",").map((model) => model.trim()).filter(Boolean)
    : DEFAULT_GEMINI_FALLBACK_MODELS;

  return [...new Set([
    primaryModel?.trim() || DEFAULT_GEMINI_MODEL,
    ...fallbackList,
  ])];
}

async function generateGeminiTextWithModel({
  apiKey,
  model,
  system,
  messages,
  maxOutputTokens,
  temperature,
}: GenerateTextOptions & { apiKey: string; model: string }) {
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
    throw new GeminiRequestError(
      `Gemini request failed: ${response.status} ${
        data.error?.message ?? JSON.stringify(data)
      }`,
      response.status,
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
    throw new GeminiRequestError(
      `Gemini returned an empty response${
        blockReason || finishReason
          ? ` (${blockReason ?? finishReason})`
          : ""
      }.`,
    );
  }

  return text;
}

function shouldTryNextGeminiModel(error: unknown) {
  if (!(error instanceof GeminiRequestError)) {
    return true;
  }

  return (
    !error.status ||
    error.status === 429 ||
    error.status === 503 ||
    error.status >= 500
  );
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
