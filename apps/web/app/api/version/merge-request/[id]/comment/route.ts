import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (content.length < 2) {
      return NextResponse.json({ error: "Comment too short" }, { status: 400 });
    }

    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id },
      include: { chat: true },
    });
    if (!mergeRequest || mergeRequest.chat.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.mergeComment.create({
      data: {
        mergeRequestId: id,
        authorId: (session.user as any).id,
        content,
      },
    });

    return NextResponse.json({ comment });
  } catch (error: any) {
    console.error("MERGE_COMMENT_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
