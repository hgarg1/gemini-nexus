import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: organizationId } = await params;

  const links = await prisma.organizationLink.findMany({
    where: { organizationId },
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ links });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: organizationId } = await params;
  const { label, roleId, requiresApproval, maxUses, expiresAt, isPrimary } = await req.json();

  const link = await prisma.$transaction(async (tx) => {
    let resolvedRoleId = roleId;
    if (isPrimary && !resolvedRoleId) {
      const org = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, slug: true }
      });
      if (org) {
        const roleName = `Org Admin - ${org.name}`;
        const existingRole = await tx.role.findUnique({ where: { name: roleName } });
        if (existingRole) {
          resolvedRoleId = existingRole.id;
        } else {
          const createdRole = await tx.role.create({
            data: {
              name: roleName,
              description: `Org admin for ${org.name}`,
              organizationId
            }
          });
          resolvedRoleId = createdRole.id;
        }
      }
    }

    if (isPrimary) {
      await tx.organizationLink.updateMany({
        where: { organizationId, isPrimary: true },
        data: { isPrimary: false }
      });
    }
    return tx.organizationLink.create({
      data: {
        organizationId,
        label,
        roleId: resolvedRoleId,
        requiresApproval: requiresApproval ?? true,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPrimary: !!isPrimary
      },
      include: { role: true },
    });
  });

  return NextResponse.json(link);
}
