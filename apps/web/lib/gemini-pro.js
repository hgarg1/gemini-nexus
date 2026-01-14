import { GoogleGenerativeAI } from "@google/generative-ai";
export const generateImageLabels = async (image, apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.0-pro" });
    const mimeType = image.match(/data:(.*?);/)?.[1] || "image/jpeg";
    const base64Data = image.split(",")[1];
    const prompt = `Perform an elite-level forensic analysis of this image. 
  Provide 8-12 hyper-precise, technical, and semantic labels for a professional neural indexing system.
  Focus on: Composition, Lighting, Technical Subject, Materiality, and Meta-data inferences.
  Example: "anamorphic-flare, structural-engineering, raw-concrete, isometric-projection, high-dynamic-range".
  Return ONLY the labels separated by commas. No preamble or conversational text.`;
    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: base64Data || "",
                mimeType: mimeType
            }
        }
    ]);
    const response = await result.response;
    return response.text().split(",").map(s => s.trim().toLowerCase().replace(/\s+/g, '-'));
};
export const extractMemories = async (prompt, responseText, apiKey) => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);
        const rawName = process.env.GEMINI_MEMORY_MODEL || "gemini-2.0-flash";
        const modelName = rawName.startsWith("models/") ? rawName : `models/${rawName}`;
        const model = genAI.getGenerativeModel({ model: modelName });
        const systemPrompt = `You are a memory extraction engine.
Capture durable, user-specific memories worth saving long-term.
Use casual signals: preferences, identity, ongoing projects, constraints, or stable facts.
Do NOT require explicit phrases like "remember this".
Avoid transient items like one-off questions or temporary tasks.
Return ONLY valid JSON in this format:
{"memories":[{"label":"...","content":"..."}]}
If nothing should be saved, return {"memories":[]} with no extra text.`;
        const result = await model.generateContent([
            systemPrompt,
            `USER_PROMPT: ${prompt}`,
            `ASSISTANT_RESPONSE: ${responseText}`,
        ]);
        const response = await result.response;
        const text = response.text().trim();
        const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fencedMatch ? fencedMatch[1] : text;
        const jsonMatch = (candidate || "").match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            return fallbackMemories(prompt);
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed?.memories || !Array.isArray(parsed.memories))
                return [];
            const extracted = parsed.memories
                .filter((m) => typeof m?.label === "string" && typeof m?.content === "string")
                .map((m) => ({
                label: m.label.trim(),
                content: m.content.trim(),
            }))
                .filter((m) => m.label.length >= 2 && m.content.length >= 3)
                .slice(0, 3);
            const combined = dedupeMemories([...extracted, ...fallbackMemories(prompt)]);
            return combined.slice(0, 3);
        }
        catch {
            return fallbackMemories(prompt);
        }
    }
    catch (error) {
        return fallbackMemories(prompt);
    }
};
const dedupeMemories = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = `${item.label.toLowerCase()}::${item.content.toLowerCase()}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
};
const sanitizeMemory = (value) => value.replace(/\s+/g, " ").replace(/["'`]+/g, "").trim().slice(0, 160);
const fallbackMemories = (prompt) => {
    const memories = [];
    const rememberMatch = prompt.match(/remember(?:\s+that)?[:\s-]+(.+)/i);
    if (rememberMatch?.[1]) {
        memories.push({ label: "user note", content: sanitizeMemory(rememberMatch[1]) });
    }
    const nameMatch = prompt.match(/(?:my name is|call me|i go by)\s+([a-z0-9][^.,;\n]{1,40})/i);
    if (nameMatch?.[1]) {
        memories.push({ label: "preferred name", content: `Preferred name: ${sanitizeMemory(nameMatch[1])}` });
    }
    const preferenceMatch = prompt.match(/(?:i prefer|i like|i love)\s+([a-z0-9][^.,;\n]{2,80})/i);
    if (preferenceMatch?.[1]) {
        memories.push({ label: "preference", content: sanitizeMemory(preferenceMatch[1]) });
    }
    const dislikeMatch = prompt.match(/(?:i hate|i dislike|i do not like)\s+([a-z0-9][^.,;\n]{2,80})/i);
    if (dislikeMatch?.[1]) {
        memories.push({ label: "avoid", content: sanitizeMemory(dislikeMatch[1]) });
    }
    const emailMatch = prompt.match(/\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i);
    if (emailMatch?.[1]) {
        memories.push({ label: "email", content: emailMatch[1].toLowerCase() });
    }
    const phoneMatch = prompt.match(/\b(\+?\d[\d\s().-]{6,}\d)\b/);
    if (phoneMatch?.[1]) {
        memories.push({ label: "phone", content: sanitizeMemory(phoneMatch[1]) });
    }
    return dedupeMemories(memories).slice(0, 3);
};
