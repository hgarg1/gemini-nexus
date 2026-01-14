import { prisma } from "@repo/database";
import { AuditLogView } from "@/components/admin/audit-log-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: (session?.user as any)?.id },
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
    include: { 
        user: { select: { email: true, name: true, image: true } } 
    },
  });

  const serializedLogs = logs.map(log => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return <AuditLogView initialLogs={serializedLogs} />;
}