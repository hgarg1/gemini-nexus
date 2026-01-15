import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (user as any).id;

    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { userId: userId },
          { collaborators: { some: { userId: userId } } }
        ]
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        userId: true,
        messages: {
           take: 1,
           orderBy: { createdAt: 'desc' },
           select: { content: true }
        }
      }
    });

    const formattedChats = chats.map(chat => ({
        id: chat.id,
        name: chat.title,
        updatedAt: chat.updatedAt,
        message: chat.messages[0]?.content || "No messages yet",
        // Add avatars if we had bot info, for now use placeholders or fetch bot relation
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (user as any).id;
    const { title, config, botId } = await req.json();

    const chat = await prisma.chat.create({
      data: {
        title: title || "New Transmission",
        userId: userId,
        config: config || {},
        botId: botId || undefined
      }
    });

    return NextResponse.json({ chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}