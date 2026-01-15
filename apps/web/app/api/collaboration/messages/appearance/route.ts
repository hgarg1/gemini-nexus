import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (sessionUser as any).id;
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
