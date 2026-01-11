import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const chatId = typeof body.chatId === "string" ? body.chatId : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const baseCheckpointId =
      typeof body.baseCheckpointId === "string" ? body.baseCheckpointId : undefined;

    if (!chatId || !name) {
      return NextResponse.json({ error: "chatId and name required" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });
    if (!chat || chat.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const branch = await prisma.branch.create({
      data: {
        chatId,
        name,
        baseCheckpointId,
      },
    });

    return NextResponse.json({ branch });
  } catch (error: any) {
    console.error("BRANCH_CREATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
