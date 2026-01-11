import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";

  if (!session?.user || !isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRole: { include: { permissions: true } },
        overrides: { include: { permission: true } },
        memberships: {
          include: {
            role: { include: { permissions: true } }
          }
        }
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const effective = new Map<string, { source: string; value: boolean }>();

    // 1. Role Permissions
    user.userRole?.permissions.forEach(p => {
      effective.set(p.name, { source: `Role: ${user.userRole?.name}`, value: true });
    });

    // 2. Org Roles
    user.memberships.forEach(m => {
      m.role?.permissions.forEach(p => {
        effective.set(p.name, { source: `Org Role: ${m.role?.name}`, value: true });
      });
    });

    // 3. Overrides (Take Precedence)
    user.overrides.forEach(o => {
      effective.set(o.permission.name, { source: "Individual Override", value: o.value });
    });

    return NextResponse.json({
      userId: id,
      permissions: Array.from(effective.entries()).map(([name, detail]) => ({
        name,
        ...detail
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to compute permissions" }, { status: 500 });
  }
}
