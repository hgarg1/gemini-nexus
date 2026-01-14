import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel, generateEmbedding, cosineSimilarity } from "@/lib/gemini";
import { prisma } from "@repo/database";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages, config, systemInstruction, botId, skills } = await req.json();
    
    // Tools Configuration
    const tools = [];
    if (skills?.includes('web_search')) {
        tools.push({ googleSearch: {} });
    }
    
    // RAG Logic
    let ragContext = "";
    if (botId) {
        try {
            const kb = await prisma.knowledgeBase.findUnique({
                where: { botId },
                include: { chunks: true }
            });

            if (kb && kb.chunks.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const queryEmbedding = await generateEmbedding(lastMessage.content, (session.user as any).apiKey);
                
                // Calculate similarity in-memory (Mock RAG for prototype)
                const scoredChunks = kb.chunks.map(chunk => ({
                    content: chunk.content,
                    score: cosineSimilarity(queryEmbedding, chunk.embedding)
                }));

                // Sort and take top 3
                scoredChunks.sort((a, b) => b.score - a.score);
                const topChunks = scoredChunks.slice(0, 3);
                
                if (topChunks.length > 0 && topChunks[0].score > 0.6) { // Threshold
                    ragContext = "\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n" + 
                                 topChunks.map(c => `- ${c.content}`).join("\n");
                }
            }
        } catch (e) {
            console.error("RAG Failure", e);
        }
    }

    // Construct the model configuration
    const modelName = config?.model || "models/gemini-2.0-flash";
    const apiKey = (session.user as any).apiKey;

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
    
    // Inject RAG context into system instruction
    const finalSystemInstruction = (systemInstruction || "") + ragContext;

    const generativeModel = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: finalSystemInstruction ? { parts: [{ text: finalSystemInstruction }] } : undefined,
        tools: tools.length > 0 ? tools : undefined
    });

    const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));
    const prompt = messages[messages.length - 1].content;

    const chatSession = generativeModel.startChat({
        history,
        generationConfig: {
            temperature: config?.temperature || 0.7,
        }
    });

    const result = await chatSession.sendMessageStream(prompt);
    
    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                controller.enqueue(new TextEncoder().encode(chunkText));
            }
            controller.close();
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        }
    });

  } catch (error: any) {
    console.error("[SIMULATION_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}