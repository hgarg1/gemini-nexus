import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatId } = await params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { 
            assets: true,
            reactions: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          }
        },
        assets: true,
        collaborators: true,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Security check: User must be owner or collaborator or chat must be public
    const userId = (user as any).id;
    const isOwner = chat.userId === userId;
    const isCollaborator = chat.collaborators.some((c) => c.userId === userId);

    if (!isOwner && !isCollaborator && !chat.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title : undefined;
    const config = body.config && typeof body.config === "object" ? body.config : undefined;
    const { id: chatId } = await params;
    const userId = (user as any).id;

    const data: { title?: string; config?: any } = {};
    if (title !== undefined) data.title = title;
    if (config !== undefined) data.config = config;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const chat = await prisma.chat.update({
      where: { id: chatId, userId },
      data
    });

    return NextResponse.json({ chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: chatId } = await params;
    const userId = (user as any).id;

    await prisma.chat.delete({
      where: { id: chatId, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
