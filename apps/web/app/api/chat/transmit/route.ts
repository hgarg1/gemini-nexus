import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { getTransmissionQueue } from "@/lib/queue";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

export async function POST(req: NextRequest) {
  try {
    let session = await getServerSession(authOptions);
    let userId: string | null = (session?.user as any)?.id;

    // Mobile Auth Fallback
    if (!userId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const apiKey = authHeader.split(" ")[1];
        // API Key lookup - assuming apiKey is unique in User table
        const user = await prisma.user.findFirst({ where: { apiKey } });
        if (user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, chatId, history, config, customKey, image, images, metadata, branchId } = await req.json();
    const payloadImages = Array.isArray(images) ? images : image ? [image] : [];
    const payloadMeta = Array.isArray(metadata) ? metadata : metadata ? [metadata] : [];

    // 1. Verify access
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { collaborators: true }
    });

    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const isOwner = chat.userId === userId;
    const isCollaborator = chat.collaborators.some((c) => c.userId === userId);
    if (!isOwner && !isCollaborator && !chat.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { policy } = await getEffectiveChatPolicy(userId);
    if (!policy.allowFileUploads && payloadImages.length > 0) {
      return NextResponse.json({ error: "File uploads disabled by policy" }, { status: 403 });
    }

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
    const transmissionQueue = getTransmissionQueue();
    if (!transmissionQueue) {
        throw new Error("Queue service unavailable");
    }

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

    // Fetch full user message with assets/reactions
    const fullUserMsg = await prisma.message.findUnique({
      where: { id: userMsg.id },
      include: { 
        assets: true,
        reactions: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    const fullModelMsg = await prisma.message.findUnique({
      where: { id: modelMsg.id },
      include: { 
        assets: true,
        reactions: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    return NextResponse.json({ 
      userMessage: fullUserMsg,
      placeholderMessage: fullModelMsg 
    });
  } catch (error: any) {
    console.error("Queue Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
