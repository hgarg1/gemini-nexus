import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatId } = await params;
    const userId = (session.user as any).id;

    // Verify ownership
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { isPublic: true },
    });

    return NextResponse.json({ chat: updatedChat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}