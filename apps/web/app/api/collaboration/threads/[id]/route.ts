import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (sessionUser as any).id;

  const { policy } = await getEffectiveChatPolicy(userId);
  if (!policy.allowDeleteThreads) {
    return NextResponse.json({ error: "Thread deletion disabled by policy" }, { status: 403 });
  }

  // 1. Try to see if it's a Chat (Group/Squad)
  const chat = await prisma.chat.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (chat) {
    if (chat.userId !== userId) {
      return NextResponse.json({ error: "Only owners can delete channels." }, { status: 403 });
    }
    await prisma.chat.delete({ where: { id } });
    return NextResponse.json({ success: true, type: "CHAT" });
  }

  // 2. Otherwise assume it's a User ID for a DM thread
  // We'll delete all messages between the current user and the target user
  await prisma.directMessage.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: id },
        { senderId: id, receiverId: userId },
      ],
    },
  });

  return NextResponse.json({ success: true, type: "DM" });
}
