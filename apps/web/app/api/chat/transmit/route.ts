import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const transmissionQueue = new Queue("transmission-queue", { connection: connection as any });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, chatId, history, config, customKey, image, images, metadata, branchId } = await req.json();
    const userId = (session.user as any).id;
    const payloadImages = Array.isArray(images) ? images : image ? [image] : [];
    const payloadMeta = Array.isArray(metadata) ? metadata : metadata ? [metadata] : [];

    // 1. Verify access
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { collaborators: true }
    });

    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    // 2. Create placeholder messages and Asset in DB
    const [userMsg, modelMsg] = await prisma.$transaction([
      prisma.message.create({
        data: { 
          chatId, 
          role: "user", 
          content: prompt,
          assets: payloadImages.length ? {
            create: payloadImages.map((url, idx) => ({
              url,
              role: "user",
              chatId,
              width: payloadMeta[idx]?.width,
              height: payloadMeta[idx]?.height,
              ratio: payloadMeta[idx]?.ratio,
            }))
          } : undefined
        }
      }),
      prisma.message.create({
        data: { chatId, role: "model", content: "..." } 
      })
    ]);

    // 3. Get API Key
    let apiKey = customKey;
    if (!apiKey) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { apiKey: true }
      });
      apiKey = user?.apiKey || undefined;
    }

    // 4. Add to Queue
    await transmissionQueue.add("process-gemini", {
      prompt,
      chatId,
      history,
      config,
      apiKey,
      images: payloadImages,
      branchId,
      modelMessageId: modelMsg.id,
      userMessageId: userMsg.id
    });

    return NextResponse.json({ 
      userMessage: userMsg,
      placeholderMessage: modelMsg 
    });
  } catch (error: any) {
    console.error("Queue Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
