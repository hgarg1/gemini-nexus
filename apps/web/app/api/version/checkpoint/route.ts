import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { computeDelta, materializeState, normalizeMessage } from "@/lib/versioning";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const chatId = typeof body.chatId === "string" ? body.chatId : "";
    const branchId = typeof body.branchId === "string" ? body.branchId : "";
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : undefined;

    if (!chatId || !branchId || label.length < 2) {
      return NextResponse.json({ error: "Invalid checkpoint input" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });
    if (!chat || chat.userId !== (user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch || branch.chatId !== chatId) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const parentId = branch.headId || branch.baseCheckpointId || null;
    const baseState = parentId ? await materializeState(prisma, parentId) : new Map();

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: { assets: true },
      orderBy: { createdAt: "asc" },
    });

    const currentMessages = messages.map(normalizeMessage);
    const delta = computeDelta(baseState, currentMessages);

    if (
      delta.adds.length === 0 &&
      delta.updates.length === 0 &&
      delta.deletes.length === 0
    ) {
      return NextResponse.json({ error: "No changes to checkpoint" }, { status: 400 });
    }

    const checkpoint = await prisma.checkpoint.create({
      data: {
        chatId,
        branchId,
        label,
        comment,
        delta,
        parentId: parentId || undefined,
        createdById: (user as any).id,
      },
    });

    await prisma.branch.update({
      where: { id: branchId },
      data: { headId: checkpoint.id },
    });

    return NextResponse.json({ checkpoint });
  } catch (error: any) {
    console.error("CHECKPOINT_CREATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
