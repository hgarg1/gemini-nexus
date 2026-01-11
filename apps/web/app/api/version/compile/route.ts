import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { materializeState } from "@/lib/versioning";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const chatId = typeof body.chatId === "string" ? body.chatId : "";
    const branchId = typeof body.branchId === "string" ? body.branchId : "";

    if (!chatId || !branchId) {
      return NextResponse.json({ error: "chatId and branchId required" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });
    if (!chat || chat.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch || branch.chatId !== chatId) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const headId = branch.headId || branch.baseCheckpointId;
    if (!headId) {
      return NextResponse.json({ error: "Branch has no checkpoints" }, { status: 400 });
    }

    const state = await materializeState(prisma, headId);
    const compiledState = Array.from(state.values());
    const compiledAt = new Date();

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        compiledState,
        lastCompiledAt: compiledAt,
      },
    });

    return NextResponse.json({
      compiledAt,
      messageCount: compiledState.length,
      headId,
    });
  } catch (error: any) {
    console.error("VERSION_COMPILE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
