import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export type AdminContext = {
  user: {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
  };
  roleName: string;
  permissions: string[];
};

export const isAdminRole = (roleName: string) => {
  const normalized = roleName.toLowerCase();
  return roleName === "Super Admin" || roleName === "Admin" || normalized === "admin";
};

export const isSuperAdmin = (roleName: string) => {
  const normalized = roleName.toLowerCase();
  return roleName === "Super Admin" || normalized === "super admin";
};

export const getAdminContext = async (req: NextRequest): Promise<AdminContext | null> => {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return null;

  const userRecord = await prisma.user.findUnique({
    where: { id: (sessionUser as any).id },
    include: {
      userRole: { include: { permissions: true } },
      overrides: { include: { permission: true } },
      memberships: {
        include: {
          role: { include: { permissions: true } },
        },
      },
    },
  });

  if (!userRecord) return null;

  const roleName = userRecord.userRole?.name || userRecord.role || "";

  const effective = new Map<string, boolean>();
  userRecord.userRole?.permissions.forEach((permission) => {
    effective.set(permission.name, true);
  });
  userRecord.memberships.forEach((member) => {
    member.role?.permissions.forEach((permission) => {
      effective.set(permission.name, true);
    });
  });
  userRecord.overrides.forEach((override) => {
    effective.set(override.permission.name, override.value);
  });

  const permissions = Array.from(effective.entries())
    .filter(([, value]) => value)
    .map(([name]) => name);

  return {
    user: {
      id: userRecord.id,
      role: roleName,
      name: userRecord.name,
      email: userRecord.email,
    },
    roleName,
    permissions,
  };
};
