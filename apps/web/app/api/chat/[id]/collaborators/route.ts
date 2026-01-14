import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: chatId } = await params;
  const userId = (session.user as any).id;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      collaborators: { include: { user: true } },
      user: true,
    },
  });

  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const isOwner = chat.userId === userId;
  const isCollaborator = chat.collaborators.some((c) => c.userId === userId);

  if (!isOwner && !isCollaborator && !chat.isPublic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const owner = {
    id: chat.user.id,
    name: chat.user.name,
    email: chat.user.email,
    image: chat.user.image,
    isOwner: true,
  };

  const collaborators = chat.collaborators.map((c) => ({
    id: c.user.id,
    name: c.user.name,
    email: c.user.email,
    image: c.user.image,
    joinedAt: c.createdAt,
    isOwner: false,
  }));

  return NextResponse.json({ owner, collaborators });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: chatId } = await params;
  const userId = (session.user as any).id;
  const { collaboratorId } = await req.json();

  if (!collaboratorId || typeof collaboratorId !== "string") {
    return NextResponse.json({ error: "Invalid collaborator" }, { status: 400 });
  }

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { userId: true },
  });

  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.collaborator.deleteMany({
    where: { chatId, userId: collaboratorId },
  });

  return NextResponse.json({ success: true });
}
