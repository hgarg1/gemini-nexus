import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { generateEmbedding } from "@/lib/gemini";

// Helper to chunk text
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { botId } = await params;

  try {
    // 1. Verify Access
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { knowledgeBase: true }
    });

    if (!bot || bot.creatorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Ensure KnowledgeBase exists
    let kbId = bot.knowledgeBase?.id;
    if (!kbId) {
      const kb = await prisma.knowledgeBase.create({
        data: { botId }
      });
      kbId = kb.id;
    }

    // 3. Process Files
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    
    let processedCount = 0;

    for (const file of files) {
      // Basic text extraction (supports txt, md, json, csv)
      // For PDF/Docx, we would need external libs like pdf-parse
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        const text = await file.text();
        const chunks = chunkText(text);

        // Generate embeddings and save chunks
        // Note: Running in serial to avoid rate limits on free tier, parallelize in prod
        for (const chunk of chunks) {
            if (chunk.trim().length < 10) continue; // Skip empty noise
            
            try {
                const embedding = await generateEmbedding(chunk, (session.user as any).apiKey);
                
                await prisma.documentChunk.create({
                    data: {
                        knowledgeBaseId: kbId,
                        content: chunk,
                        embedding: embedding, // Stored as Float[]
                        metadata: {
                            filename: file.name,
                            type: file.type
                        }
                    }
                });
            } catch (e) {
                console.error(`Failed to embed chunk for ${file.name}`, e);
            }
        }
        processedCount++;
      }
    }

    // Update timestamp
    await prisma.knowledgeBase.update({
        where: { id: kbId },
        data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, processed: processedCount });

  } catch (error: any) {
    console.error("[KNOWLEDGE_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
