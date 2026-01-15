import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (sessionUser as any).id;
  const { messageId, emoji } = await req.json();

  if (!messageId || !emoji) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if reaction already exists
  const existing = await prisma.directMessageReaction.findUnique({
    where: {
      directMessageId_userId_emoji: {
        directMessageId: messageId,
        userId,
        emoji,
      },
    },
  });

  if (existing) {
    // Remove if exists (toggle off)
    await prisma.directMessageReaction.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ success: true, action: "REMOVED" });
  } else {
    // Add if not exists (toggle on)
    await prisma.directMessageReaction.create({
      data: {
        directMessageId: messageId,
        userId,
        emoji,
      },
    });
    return NextResponse.json({ success: true, action: "ADDED" });
  }
}
