import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    if (!chatId) {
      return NextResponse.json({ error: "chatId required" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });
    if (!chat || chat.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingBranches = await prisma.branch.findMany({
      where: { chatId },
    });

    if (existingBranches.length === 0) {
      await prisma.branch.create({
        data: {
          chatId,
          name: "master",
        },
      });
    }

    const branches = await prisma.branch.findMany({
      where: { chatId },
      include: {
        head: true,
        baseCheckpoint: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const checkpoints = await prisma.checkpoint.findMany({
      where: { chatId },
      include: {
        comments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const mergeRequests = await prisma.mergeRequest.findMany({
      where: { chatId },
      include: {
        sourceBranch: true,
        targetBranch: true,
        comments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ branches, checkpoints, mergeRequests });
  } catch (error: any) {
    console.error("VERSION_GET_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
