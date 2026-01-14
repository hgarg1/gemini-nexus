import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

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

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
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
