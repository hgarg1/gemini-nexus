import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const label = typeof body.label === "string" ? body.label.trim() : undefined;
    const comment = typeof body.comment === "string" ? body.comment.trim() : undefined;

    if (label !== undefined && label.length < 2) {
      return NextResponse.json({ error: "Label must be at least 2 characters" }, { status: 400 });
    }

    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id },
      include: { chat: true },
    });
    if (!checkpoint || checkpoint.chat.userId !== (user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.checkpoint.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(comment !== undefined ? { comment } : {}),
      },
    });

    return NextResponse.json({ checkpoint: updated });
  } catch (error: any) {
    console.error("CHECKPOINT_UPDATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
