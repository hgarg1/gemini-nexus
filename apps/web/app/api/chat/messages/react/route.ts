import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { messageId, emoji } = await req.json();

  if (!messageId || !emoji) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if reaction already exists
  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji,
      },
    },
  });

  if (existing) {
    // Remove if exists (toggle off)
    await prisma.messageReaction.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ success: true, action: "REMOVED" });
  } else {
    // Add if not exists (toggle on)
    await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });
    return NextResponse.json({ success: true, action: "ADDED" });
  }
}
