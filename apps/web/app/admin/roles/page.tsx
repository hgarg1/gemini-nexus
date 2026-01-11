import { prisma } from "@repo/database";
import { RoleManagement } from "@/components/admin/role-management";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: "asc" },
    }),
    prisma.permission.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedRoles = roles.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const serializedPermissions = permissions.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <RoleManagement 
      initialRoles={serializedRoles} 
      availablePermissions={serializedPermissions} 
    />
  );
}
