import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin" && (session.user as any).role !== "Super Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // 1. Fetch chat history for logging/recovery before deletion
    const chat = await prisma.adminAIChat.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: "asc" } } }
    });

    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    // 2. Log deletion with full history snapshot
    await prisma.usageLog.create({
        data: {
            userId: (session.user as any).id,
            action: "admin_ai_chat_delete",
            resource: id,
            details: {
                title: chat.title,
                snapshot: chat.messages.map(m => ({
                    role: m.role,
                    content: m.content,
                    proposal: m.proposal,
                    createdAt: m.createdAt
                }))
            }
        }
    });

    // 3. Delete chat (Prisma handles messages via Cascade if configured, otherwise delete manual)
    await prisma.adminAIChat.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN_AI_CHAT_DELETE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
