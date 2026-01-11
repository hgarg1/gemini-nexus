import { prisma } from "@repo/database";
import { AuditLogView } from "@/components/admin/audit-log-view";

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
  const logs = await prisma.usageLog.findMany({
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