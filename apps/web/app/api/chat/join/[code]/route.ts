import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const link = await prisma.chatLink.findUnique({
    where: { code, active: true },
    include: { chat: { select: { id: true, title: true, userId: true } } },
  });

  if (!link) return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link has expired." }, { status: 410 });
  }
  if (link.maxUses && link.useCount >= link.maxUses) {
    return NextResponse.json({ error: "Link use limit reached." }, { status: 410 });
  }

  return NextResponse.json({ chat: link.chat, linkId: link.id });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { code } = await params;
  const userId = (user as any).id;

  const link = await prisma.chatLink.findUnique({
    where: { code, active: true },
  });

  if (!link) return NextResponse.json({ error: "Invalid link." }, { status: 404 });

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link has expired." }, { status: 410 });
  }

  if (link.maxUses && link.useCount >= link.maxUses) {
    return NextResponse.json({ error: "Link use limit reached." }, { status: 410 });
  }

  const chat = await prisma.chat.findUnique({
    where: { id: link.chatId },
    include: { collaborators: true },
  });

  if (!chat) return NextResponse.json({ error: "Chat not found." }, { status: 404 });

  // Create connection and intro message
  if (chat.userId !== userId) {
    const existingConnection = await prisma.userConnection.findFirst({
        where: {
            OR: [
                { requesterId: userId, targetId: chat.userId },
                { requesterId: chat.userId, targetId: userId }
            ]
        }
    });

    if (!existingConnection) {
        await prisma.userConnection.create({
            data: {
                requesterId: userId,
                targetId: chat.userId,
                status: "ACCEPTED" // Auto-accept for link joins
            }
        });
    } else if (existingConnection.status === "PENDING") {
        await prisma.userConnection.update({
            where: { id: existingConnection.id },
            data: { status: "ACCEPTED" }
        });
    }

    // Auto-create intro message
    const introContent = `SYSTEM_MSG: User joined via link ${code}. Secure channel established.`;
    await prisma.directMessage.create({
        data: {
            senderId: userId,
            receiverId: chat.userId,
            content: introContent
        }
    });
  }

  if (chat.userId === userId || chat.collaborators.some((c) => c.userId === userId)) {
    return NextResponse.json({ status: "ALREADY_JOINED", chatId: chat.id });
  }

  const { policy } = await getEffectiveChatPolicy(userId);
  if (!policy.allowCollaborators) {
    return NextResponse.json({ error: "Collaboration disabled by policy" }, { status: 403 });
  }

  if (chat.collaborators.length >= policy.maxCollaborators) {
    return NextResponse.json({ error: "Collaborator limit reached" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.chatLink.update({
      where: { id: link.id },
      data: { useCount: { increment: 1 } },
    }),
    prisma.collaborator.create({
      data: {
        chatId: chat.id,
        userId,
      },
    }),
  ]);

  return NextResponse.json({ status: "JOINED", chatId: chat.id });
}
