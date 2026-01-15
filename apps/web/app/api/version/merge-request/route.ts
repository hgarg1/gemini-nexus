import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const chatId = typeof body.chatId === "string" ? body.chatId : "";
    const sourceBranchId = typeof body.sourceBranchId === "string" ? body.sourceBranchId : "";
    const targetBranchId = typeof body.targetBranchId === "string" ? body.targetBranchId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : undefined;

    if (!chatId || !sourceBranchId || !targetBranchId || title.length < 2) {
      return NextResponse.json({ error: "Invalid merge request input" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });
    if (!chat || chat.userId !== (user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mergeRequest = await prisma.mergeRequest.create({
      data: {
        chatId,
        sourceBranchId,
        targetBranchId,
        title,
        description,
        createdById: (user as any).id,
      },
    });

    return NextResponse.json({ mergeRequest });
  } catch (error: any) {
    console.error("MERGE_REQUEST_CREATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
