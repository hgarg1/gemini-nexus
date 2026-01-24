import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@repo/ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();
    const apiKey = (session.user as any).apiKey;
    const model = getGeminiModel("models/gemini-2.0-flash", apiKey);

    const systemPrompt = `You are an expert AI Character Designer.
    Your task is to generate a complete configuration for a custom AI agent based on the user's description.
    
    Output STRICT JSON matching this structure:
    {
      "name": "Creative name",
      "description": "Short catchy description",
      "systemInstruction": "Detailed system prompt defining personality, tone, and constraints.",
      "appearance": {
        "themeColor": "#HexCode",
        "avatarStyle": "default|retro|cyber|organic",
        "animation": "default|glitch|liquid|typewriter"
      },
      "skills": ["web_search", "image_generation"] (Include only if relevant to the description)
    }
    
    Example User Prompt: "A cyberpunk hacker"
    Example Output:
    {
      "name": "N30_N3XUS",
      "description": "Elite netrunner specialized in data extraction.",
      "systemInstruction": "You are N30_N3XUS, an elite hacker. You speak in leet speak and use technical jargon. You are paranoid and secretive.",
      "appearance": {
        "themeColor": "#00FF00",
        "avatarStyle": "cyber",
        "animation": "glitch"
      },
      "skills": ["web_search"]
    }
    `;

    const result = await model.generateContent([
        systemPrompt,
        `USER_DESCRIPTION: ${prompt}`
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        throw new Error("Failed to generate valid JSON configuration.");
    }

    const config = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ config });

  } catch (error: any) {
    console.error("[MAGIC_CONFIG_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
