import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { otherUserId, appearance } = await req.json();

  if (!otherUserId) return NextResponse.json({ error: "Missing recipient" }, { status: 400 });

  const connection = await prisma.userConnection.findFirst({
    where: {
      OR: [
        { requesterId: userId, targetId: otherUserId },
        { requesterId: otherUserId, targetId: userId },
      ],
    },
  });

  if (!connection) return NextResponse.json({ error: "Uplink not found" }, { status: 404 });

  await prisma.userConnection.update({
    where: { id: connection.id },
    data: { appearanceSettings: appearance },
  });

  return NextResponse.json({ success: true });
}
