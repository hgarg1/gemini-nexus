import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (user as any).id;

  const blockedConnections = await prisma.userConnection.findMany({
    where: {
      requesterId: userId,
      status: "BLOCKED",
    },
    include: {
      target: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({ blockedUsers: blockedConnections.map(c => c.target) });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (user as any).id;
  const { targetId } = await req.json();

  if (!targetId) {
    return NextResponse.json({ error: "Target ID required" }, { status: 400 });
  }

  const connection = await prisma.userConnection.findFirst({
    where: {
      requesterId: userId,
      targetId: targetId,
      status: "BLOCKED",
    },
  });

  if (connection) {
    await prisma.userConnection.delete({ where: { id: connection.id } });
  }

  return NextResponse.json({ success: true });
}
