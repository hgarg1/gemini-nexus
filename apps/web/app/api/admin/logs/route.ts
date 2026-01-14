import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "admin" && (session.user as any).role !== "Super Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { canViewBlockLogs: true }
  });

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
