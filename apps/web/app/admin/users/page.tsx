import { prisma } from "@repo/database";
import { UserManagement } from "@/components/admin/user-management";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        authenticators: { select: { credentialID: true } },
        userRole: true,
        memberships: {
            include: { organization: true }
        }
      }, 
      take: 100,
    }),
    prisma.role.findMany({
        orderBy: { name: "asc" }
    })
  ]);

  const serializedUsers = users.map(user => ({
    ...user,
    role: user.userRole?.name || "user",
    organizations: user.memberships.map(m => m.organization.name),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    emailVerified: user.emailVerified?.toISOString() || null,
  }));

  const serializedRoles = roles.map(role => ({
    ...role,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }));

  return <UserManagement initialUsers={serializedUsers} availableRoles={serializedRoles} />;
}