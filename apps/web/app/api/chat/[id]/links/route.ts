import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: chatId } = await params;
  const userId = (user as any).id;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, userId: true },
  });

  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const links = await prisma.chatLink.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ links });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: chatId } = await params;
  const userId = (user as any).id;
  const { label, maxUses, expiresAt } = await req.json();

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, userId: true },
  });

  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { policy } = await getEffectiveChatPolicy(userId);
  if (!policy.allowPublicLinks) {
    return NextResponse.json({ error: "Chat links disabled by policy" }, { status: 403 });
  }

  const existingCount = await prisma.chatLink.count({
    where: { chatId, active: true },
  });
  if (existingCount >= policy.maxLinks) {
    return NextResponse.json({ error: "Link limit reached" }, { status: 400 });
  }

  const link = await prisma.chatLink.create({
    data: {
      chatId,
      label: typeof label === "string" ? label : null,
      maxUses: typeof maxUses === "number" ? maxUses : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(link);
}
