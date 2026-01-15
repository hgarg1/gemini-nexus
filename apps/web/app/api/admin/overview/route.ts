import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: (sessionUser as any).id },
    select: { userRole: { select: { name: true } } },
  });

  const role = admin?.userRole?.name || "";
  const isAuthorized = role === "Super Admin" || role === "Admin" || role.toLowerCase() === "admin";
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [userCount, chatCount, messageCount, memoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.memory.count(),
  ]);

  return NextResponse.json({
    stats: {
      users: userCount,
      chats: chatCount,
      messages: messageCount,
      memories: memoryCount,
    },
  });
}
