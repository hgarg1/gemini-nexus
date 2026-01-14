import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiModel = (modelName: string = "gemini-1.5-flash", apiKey?: string) => {
  const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
  const name = modelName.startsWith("models/") ? modelName : `models/${modelName}`;
  return genAI.getGenerativeModel({ model: name });
};

export const listGeminiModels = async (apiKey?: string) => {
  const key = apiKey || process.env.GEMINI_API_KEY!;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = await response.json();
    
    if (data.models) {
      // Filter for models that support generating content
      return data.models
        .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          description: m.description
        }));
    }
    throw new Error("No models found in response");
  } catch (error) {
    // Comprehensive fallback including latest 2.0 models
    return [
      { name: "models/gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
      { name: "models/gemini-2.0-flash-lite-preview-02-05", displayName: "Gemini 2.0 Flash Lite (Preview)" },
      { name: "models/gemini-1.5-flash", displayName: "Gemini 1.5 Flash" },
      { name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro" },
      { name: "models/gemini-1.0-pro", displayName: "Gemini 1.0 Pro" },
    ];
  }
};

export const extractCheckpointSuggestion = async (
  prompt: string,
  responseText: string,
  modelName: string,
  apiKey?: string
) => {
  const model = getGeminiModel(modelName, apiKey);
  const systemPrompt = `You are a version-control checkpoint selector.
Decide if a checkpoint should be created for the user's latest request.
Return ONLY valid JSON in this format:
{"checkpoint":{"label":"...","comment":"..."}}
If no checkpoint is needed, return {"checkpoint":null} with no extra text.`;

  const result = await model.generateContent([
    systemPrompt,
    `USER_PROMPT: ${prompt}`,
    `ASSISTANT_RESPONSE: ${responseText}`,
  ]);

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed?.checkpoint) return null;
    const label = typeof parsed.checkpoint.label === "string" ? parsed.checkpoint.label.trim() : "";
    const comment = typeof parsed.checkpoint.comment === "string" ? parsed.checkpoint.comment.trim() : "";
    if (label.length < 2) return null;
    return { label, comment };
  } catch {
    return null;
  }
};

export const generateGeminiResponse = async (
  prompt: string,
  history: { role: string; parts: any[] }[] = [],
  apiKey?: string,
  config?: any,
  image?: string | string[] // Base64 data with data:image/... prefix
) => {
  const modelName = config?.modelName || "models/gemini-2.0-flash";
  const model = getGeminiModel(modelName, apiKey);
  
  // Google Gemini API requires history to start with a 'user' message.
  const firstUserIndex = history.findIndex(m => m.role === "user");
  const cleanedHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

  const chat = model.startChat({
    history: cleanedHistory as any,
    generationConfig: {
      temperature: config?.temperature || 0.7,
      topP: config?.topP || 0.8,
      topK: config?.topK || 40,
      maxOutputTokens: config?.maxOutputTokens || 2048,
    },
  });

  // Prepare content parts: handle multimodal if image is present
  const contentParts: any[] = [{ text: prompt }];
  
  const imageList = Array.isArray(image) ? image : image ? [image] : [];
  imageList.forEach((entry) => {
    const mimeType = entry.match(/data:(.*?);/)?.[1] || "image/jpeg";
    const base64Data = entry.split(",")[1];
    contentParts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
  });

  const result = await chat.sendMessage(contentParts);
  const response = await result.response;
  return response.text();
};

export const generateEmbedding = async (text: string, apiKey?: string) => {
  const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    const valA = vecA[i] ?? 0;
    const valB = vecB[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};