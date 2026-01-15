import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memories = await prisma.memory.findMany({
    where: { userId: (user as any).id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!label || label.length < 2) {
      return NextResponse.json({ error: "Label must be at least 2 characters" }, { status: 400 });
    }
    if (!content || content.length < 3) {
      return NextResponse.json({ error: "Content must be at least 3 characters" }, { status: 400 });
    }

    const memory = await prisma.memory.create({
      data: {
        label,
        content,
        userId: (user as any).id,
      },
    });

    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error("MEMORY_CREATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
