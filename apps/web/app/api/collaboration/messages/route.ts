import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

const MAX_MESSAGE_LENGTH = 2000;

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (sessionUser as any).id;
  const otherId = req.nextUrl.searchParams.get("userId");
  if (!otherId) {
    return NextResponse.json({ error: "Missing user" }, { status: 400 });
  }

  const block = await prisma.userConnection.findFirst({
    where: {
      status: "BLOCKED",
      OR: [
        { requesterId: userId, targetId: otherId },
        { requesterId: otherId, targetId: userId },
      ],
    },
  });
  if (block) {
    return NextResponse.json({ error: "Messaging blocked" }, { status: 403 });
  }

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      assets: true,
      reactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  const connection = await prisma.userConnection.findFirst({
    where: {
      OR: [
        { requesterId: userId, targetId: otherId },
        { requesterId: otherId, targetId: userId },
      ],
    },
    select: { appearanceSettings: true },
  });

  return NextResponse.json({ messages, appearance: connection?.appearanceSettings });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (sessionUser as any).id;
  const { userId: otherId, content, assetUrls } = await req.json();

  if (!otherId || typeof otherId !== "string" || otherId === userId) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    if (!assetUrls || assetUrls.length === 0) {
        return NextResponse.json({ error: "Message or assets required" }, { status: 400 });
    }
  }

  if (content && content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const { policy } = await getEffectiveChatPolicy(userId);
  if (!policy.allowDirectMessages) {
    return NextResponse.json({ error: "Direct messages disabled by policy" }, { status: 403 });
  }

  const block = await prisma.userConnection.findFirst({
    where: {
      status: "BLOCKED",
      OR: [
        { requesterId: userId, targetId: otherId },
        { requesterId: otherId, targetId: userId },
      ],
    },
  });
  if (block) {
    return NextResponse.json({ error: "Messaging blocked" }, { status: 403 });
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId: userId,
      receiverId: otherId,
      content: (content || "").trim(),
      assets: {
        create: (assetUrls || []).map((url: string) => ({ url })),
      },
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      assets: true,
      reactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ message });
}
