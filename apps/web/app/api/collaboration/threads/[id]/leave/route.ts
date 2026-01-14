import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;

  const { policy } = await getEffectiveChatPolicy(userId);
  if (!policy.allowLeaveThreads) {
    return NextResponse.json({ error: "Exiting channels is disabled by policy" }, { status: 403 });
  }

  // 1. Check if it's a Chat (Group/Squad)
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: { collaborators: true },
  });

  if (chat) {
    if (chat.userId === userId) {
      return NextResponse.json({ error: "Owners cannot leave. Terminate the channel instead." }, { status: 400 });
    }
    await prisma.collaborator.deleteMany({
      where: { chatId: id, userId },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Thread not found or cannot be left." }, { status: 404 });
}
