import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

// GET: List admin chats
export async function GET(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if (!context || !isAdminRole(context.roleName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const chats = await prisma.adminAIChat.findMany({
      where: { userId: context.user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create new admin chat
export async function POST(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if (!context || !isAdminRole(context.roleName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title } = await req.json();

    const chat = await prisma.adminAIChat.create({
      data: {
        userId: context.user.id,
        title: title || "New Session",
      },
    });

    return NextResponse.json(chat);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
