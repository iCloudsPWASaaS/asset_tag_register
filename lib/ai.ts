import { AI_CONFIG, isAiConfigured } from "@/lib/env";
import type {
  ExtractedFields,
  ManualInput,
  ManualResult,
  ManualSource,
} from "@/lib/types";

const KNOWN_BRANDS = [
  "Alpha",
  "Fireco",
  "Eaton",
  "Cooper",
  "Menvier",
  "JSB",
  "Fike",
  "Apollo",
  "Hochiki",
  "Gent",
  "Notifier",
  "Honeywell",
  "Bosch",
  "Hikvision",
  "Dahua",
  "Panasonic",
  "Samsung",
  "LG",
  "Daikin",
  "Mitsubishi",
  "Vaillant",
  "Worcester Bosch",
  "Ideal",
  "Baxi",
  "Glow-worm",
  "Potterton",
  "Kidde",
  "Aico",
  "Ei",
  "FireAngel",
  "Advanced",
  "Kentec",
  "Morley",
  "C-Tec",
  "Ziton",
  "Rafiki",
  "Haes",
  "CQR",
  "Pyronix",
  "Texecom",
  "Hochiki",
  "Chubb",
  "Tyco",
  "Thomas Glover",
  "Jactone",
  "Britannia",
];

const KNOWN_TYPES = [
  "fire safety sign",
  "fire extinguisher",
  "fire alarm call point",
  "fire alarm panel",
  "smoke detector",
  "heat detector",
  "carbon monoxide detector",
  "emergency light",
  "emergency lighting",
  "fire door",
  "gas appliance",
  "boiler",
  "water heater",
  "electrical socket",
  "distribution board",
  "first aid kit",
  "security camera",
  "cctv camera",
  "air conditioning unit",
  "air conditioning",
  "refrigeration unit",
  "kitchen extractor",
  "extractor fan",
  "pat testing item",
  "pat test item",
  "fire blanket",
  "sprinkler head",
  "evacuation chair",
  "defibrillator",
];

function cleanValue(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/^[\s:;#\-–—]+/, "")
    .replace(/[\s,;]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function findLabel(text: string, labels: string[]) {
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:${labels.join("|")})\\s*(?:no\\.?|number|#)?\\s*[:\\-–—]\\s*([^\\n\\r]{1,90})`,
    "i",
  );
  const match = text.match(pattern);
  return cleanValue(match?.[1]);
}

function findBrand(text: string) {
  const lower = text.toLowerCase();
  return KNOWN_BRANDS.find((brand) => lower.includes(brand.toLowerCase())) || "";
}

function findType(text: string) {
  const lower = text.toLowerCase();
  const match = KNOWN_TYPES.find((type) => lower.includes(type));
  if (!match) return "";
  return match.charAt(0).toUpperCase() + match.slice(1);
}

function findSerialFallback(text: string) {
  const labelled = text.match(
    /(?:serial(?:\s*(?:no|number|#))?|s\s*\/\s*n|\bsn\b)\s*[:\-–—]?\s*([A-Z0-9][A-Z0-9\-/. ]{3,30})/i,
  );
  if (labelled?.[1]) return cleanValue(labelled[1]);

  const candidates = text.match(/\b(?=[A-Z0-9-]{6,24}\b)(?=[A-Z0-9-]*[A-Z])(?=[A-Z0-9-]*\d)[A-Z0-9-]{6,24}\b/g);
  if (!candidates) return "";
  return candidates.find((candidate) => !/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(candidate)) || "";
}

export function heuristicExtract(text: string): ExtractedFields {
  const normalised = text.replace(/\r/g, "").replace(/\t/g, " ");
  const make =
    findLabel(normalised, ["make", "manufacturer", "brand", "produced by"]) ||
    findBrand(normalised);
  const model = findLabel(normalised, [
    "model",
    "model no",
    "model number",
    "product model",
    "product code",
    "part no",
    "part number",
  ]);
  const type =
    findLabel(normalised, ["asset type", "equipment type", "item type", "type of asset", "type"]) ||
    findType(normalised);
  const serialNumber =
    findLabel(normalised, [
      "serial",
      "serial no",
      "serial number",
      "s/n",
      "sn",
      "asset id",
      "equipment id",
    ]) || findSerialFallback(normalised);
  const location = findLabel(normalised, [
    "location",
    "installed at",
    "installation location",
    "position",
    "area",
    "room",
  ]);
  const premisesName = findLabel(normalised, [
    "premises",
    "site",
    "site name",
    "building",
    "property",
    "company",
  ]);

  const fields: ExtractedFields = {
    premisesName: premisesName || undefined,
    location: location || undefined,
    type: type || undefined,
    make: make || undefined,
    model: model || undefined,
    serialNumber: serialNumber || undefined,
  };
  const found = Object.values(fields).filter(Boolean).length;
  fields.confidence = Math.round((found / 6) * 100) / 100;
  return fields;
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const withoutFences = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(withoutFences.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean).slice(0, 12);
}

function asSources(value: unknown): ManualSource[] {
  if (!Array.isArray(value)) return [];
  const sources: ManualSource[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const title = asString(record.title);
    const url = asString(record.url);
    if (!title || !url) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    sources.push({ title, url });
  }
  return sources.slice(0, 8);
}

type ChatMessage = { role: "system" | "user"; content: string };

async function callOpenAiCompatible(
  messages: ChatMessage[],
  image?: { base64: string; mime: string },
) {
  const useOpenRouter = !AI_CONFIG.openaiKey && Boolean(AI_CONFIG.openrouterKey);
  const key = useOpenRouter ? AI_CONFIG.openrouterKey : AI_CONFIG.openaiKey;
  if (!key) throw new Error("No OpenAI-compatible key configured.");
  const baseUrl = useOpenRouter ? "https://openrouter.ai/api/v1" : AI_CONFIG.openaiBaseUrl;
  const model = useOpenRouter
    ? process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
    : AI_CONFIG.openaiModel;

  const payloadMessages = messages.map((message, index) => {
    if (image && index === messages.length - 1) {
      return {
        role: message.role,
        content: [
          { type: "text", text: message.content },
          {
            type: "image_url",
            image_url: { url: `data:${image.mime};base64,${image.base64}` },
          },
        ],
      };
    }
    return message;
  });

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(useOpenRouter
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "AssetTag Register",
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      messages: payloadMessages,
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content || "";
}

async function callGemini(prompt: string, image?: { base64: string; mime: string }) {
  if (!AI_CONFIG.geminiKey) throw new Error("No Gemini key configured.");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (image) {
    parts.push({
      inline_data: {
        mime_type: image.mime,
        data: image.base64,
      },
    });
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_CONFIG.geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}

async function callAi(prompt: string, image?: { base64: string; mime: string }) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a precise data extraction assistant for an asset register. Return JSON only. Never invent values that are not supported by the supplied text or image.",
    },
    { role: "user", content: prompt },
  ];

  if (AI_CONFIG.openaiKey || AI_CONFIG.openrouterKey) {
    return {
      raw: await callOpenAiCompatible(messages, image),
      provider: AI_CONFIG.openaiKey ? "OpenAI" : "OpenRouter",
    };
  }
  if (AI_CONFIG.geminiKey) {
    return { raw: await callGemini(prompt, image), provider: "Gemini" };
  }
  throw new Error("No AI provider configured.");
}

export async function extractAssetFields(input: {
  text?: string;
  imageBase64?: string;
  imageMime?: string;
}): Promise<{
  fields: ExtractedFields;
  source: "ai" | "heuristic";
  provider?: string;
  notice?: string;
}> {
  const text = (input.text || "").trim();
  const heuristic = text ? heuristicExtract(text) : {};

  if (!isAiConfigured()) {
    return {
      fields: heuristic,
      source: "heuristic",
      notice: text
        ? "Parsed with the built-in label reader. Add an AI key to improve accuracy."
        : "No AI provider is configured. Run the on-device OCR scan first, or type the details manually.",
    };
  }

  const image =
    input.imageBase64 && input.imageMime
      ? { base64: input.imageBase64, mime: input.imageMime }
      : undefined;

  const prompt = [
    "Extract the asset details from the supplied label photo and/or OCR text.",
    "Return a JSON object with exactly these keys:",
    "premisesName, location, type, make, model, serialNumber, confidence.",
    "Use an empty string for anything you cannot read confidently. Confidence is 0 to 1.",
    "Prefer the photo for make/model/serial. Use the OCR text to disambiguate.",
    text ? `OCR text:\n${text}` : "OCR text: (not supplied)",
  ].join("\n\n");

  try {
    const result = await callAi(prompt, image);
    const parsed = parseJsonObject(result.raw);
    if (!parsed) {
      return { fields: heuristic, source: "heuristic", notice: "AI returned an unreadable response." };
    }
    const fields: ExtractedFields = {
      premisesName: asString(parsed.premisesName) || heuristic.premisesName,
      location: asString(parsed.location) || heuristic.location,
      type: asString(parsed.type) || heuristic.type,
      make: asString(parsed.make) || heuristic.make,
      model: asString(parsed.model) || heuristic.model,
      serialNumber: asString(parsed.serialNumber) || heuristic.serialNumber,
    };
    const confidence = Number(parsed.confidence);
    fields.confidence = Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : heuristic.confidence;
    return { fields, source: "ai", provider: result.provider };
  } catch (error) {
    console.error("extractAssetFields", error);
    return {
      fields: heuristic,
      source: "heuristic",
      notice: "The AI service was unavailable, so the built-in label reader was used.",
    };
  }
}

function searchLinks(input: ManualInput): ManualSource[] {
  const query = [input.make, input.model, input.type, "manual instructions pdf"]
    .filter(Boolean)
    .join(" ");
  const simpleQuery = [input.make, input.model, "user manual"].filter(Boolean).join(" ");
  return [
    {
      title: `Google search: ${simpleQuery}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(simpleQuery)}`,
    },
    {
      title: `Manualslib search: ${input.make} ${input.model}`,
      url: `https://www.manualslib.com/search/?q=${encodeURIComponent(
        [input.make, input.model].filter(Boolean).join(" "),
      )}`,
    },
    {
      title: `Search for a PDF: ${query}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${query} filetype:pdf`)}`,
    },
  ];
}

function fallbackManual(input: ManualInput): ManualResult {
  return {
    status: "search",
    summary: `No AI provider is configured, so the register has prepared targeted manual searches for the ${[
      input.make,
      input.model,
    ]
      .filter(Boolean)
      .join(" ")}. Open the links below and attach the manufacturer document you find.`,
    safety: [
      "Isolate the power or fuel supply before carrying out any work.",
      "Only a competent person should inspect, test or maintain this asset.",
      "Follow the manufacturer's instructions and the site's permit-to-work rules.",
    ],
    maintenance: [
      "Carry out a visual inspection and record the result.",
      "Test the asset's function using the manufacturer's recommended method.",
      "Keep the asset clean, accessible and free from obstruction.",
    ],
    specs: [],
    sources: searchLinks(input),
    generatedAt: new Date().toISOString(),
    provider: "search",
  };
}

export async function generateManufacturerManual(input: ManualInput): Promise<ManualResult> {
  const fallback = fallbackManual(input);
  if (!isAiConfigured()) return fallback;

  const prompt = [
    "You are a technical documentation assistant for a UK asset register.",
    `Asset: ${[input.make, input.model, input.type].filter(Boolean).join(" ")}.`,
    input.serialNumber ? `Serial number: ${input.serialNumber}.` : "",
    "Return JSON with exactly these keys: summary, safety, maintenance, specs, sources.",
    "summary: 2-4 sentences describing the asset and what the manufacturer instructions cover.",
    "safety: an array of concise safety points.",
    "maintenance: an array of concise inspection/maintenance tasks.",
    "specs: an array of key technical specifications you are confident about.",
    "sources: an array of objects {title, url}. Only include URLs you are confident exist. If you are not sure, return an empty array.",
    "Do not invent model-specific facts. If the model is unknown, give general guidance for that asset type and say so.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callAi(prompt);
    const parsed = parseJsonObject(result.raw);
    if (!parsed) return fallback;
    const aiSources = asSources(parsed.sources);
    return {
      status: "ai",
      summary: asString(parsed.summary) || fallback.summary,
      safety: asStringArray(parsed.safety),
      maintenance: asStringArray(parsed.maintenance),
      specs: asStringArray(parsed.specs),
      sources: [...aiSources, ...searchLinks(input)].slice(0, 10),
      model: [input.make, input.model].filter(Boolean).join(" "),
      generatedAt: new Date().toISOString(),
      provider: result.provider,
    };
  } catch (error) {
    console.error("generateManufacturerManual", error);
    return fallback;
  }
}
