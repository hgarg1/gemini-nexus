import { prisma } from "@repo/database";
import { OrganizationManagement } from "@/components/admin/organization-management";

export const dynamic = "force-dynamic";

export default async function AdminOrgsPage() {
  const [orgs, permissions] = await Promise.all([
    prisma.organization.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.permission.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  const serializedOrgs = orgs.map(o => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3005";

  return (
    <OrganizationManagement 
      initialOrgs={serializedOrgs} 
      availablePermissions={permissions} 
      baseUrl={baseUrl}
    />
  );
}