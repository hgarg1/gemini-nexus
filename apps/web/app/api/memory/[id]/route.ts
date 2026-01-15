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
    const content = typeof body.content === "string" ? body.content.trim() : undefined;

    if (label !== undefined && label.length < 2) {
      return NextResponse.json({ error: "Label must be at least 2 characters" }, { status: 400 });
    }
    if (content !== undefined && content.length < 3) {
      return NextResponse.json({ error: "Content must be at least 3 characters" }, { status: 400 });
    }

    const userId = (user as any).id;
    const result = await prisma.memory.updateMany({
      where: { id, userId },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    });

    if (!result.count) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const memory = await prisma.memory.findUnique({ where: { id } });

    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error("MEMORY_UPDATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await prisma.memory.deleteMany({
      where: { id, userId: (user as any).id },
    });

    if (!result.count) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("MEMORY_DELETE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
