import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

// GET: List admin chats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const chats = await prisma.adminAIChat.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create new admin chat
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title } = await req.json();

    const chat = await prisma.adminAIChat.create({
      data: {
        userId: (session.user as any).id,
        title: title || "New Session",
      },
    });

    return NextResponse.json(chat);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
