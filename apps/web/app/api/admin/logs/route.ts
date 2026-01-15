import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (sessionUser as any).id },
    select: { canViewBlockLogs: true, userRole: { select: { name: true } } },
  });

  const userRole = user?.userRole?.name;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: any = {};
  if (!user?.canViewBlockLogs) {
    where.action = { not: "user_block" };
  }

  const logs = await prisma.usageLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { id: true, name: true, email: true, image: true } } }
  });

  return NextResponse.json({ logs });
}
