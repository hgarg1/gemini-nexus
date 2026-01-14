import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { randomUUID } from "crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: chatId, linkId } = await params;
  const userId = (session.user as any).id;
  const payload = await req.json();

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, userId: true },
  });

  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, any> = {};
  if (typeof payload.active === "boolean") data.active = payload.active;
  if (typeof payload.label === "string") data.label = payload.label;
  if (typeof payload.maxUses === "number") data.maxUses = payload.maxUses;
  if ("expiresAt" in payload) data.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  if (payload.reissue) {
    data.code = randomUUID().replace(/-/g, "");
    data.useCount = 0;
    data.active = true;
  }

  const link = await prisma.chatLink.update({
    where: { id: linkId, chatId },
    data,
  });

  return NextResponse.json(link);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: chatId, linkId } = await params;
  const userId = (session.user as any).id;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, userId: true },
  });

  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.chatLink.delete({
    where: { id: linkId, chatId },
  });

  return NextResponse.json({ success: true });
}
