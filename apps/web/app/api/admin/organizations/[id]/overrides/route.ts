import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: organizationId } = await params;

  const overrides = await prisma.orgPermissionOverride.findMany({
    where: { organizationId },
    include: { permission: true },
  });

  return NextResponse.json({ overrides });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: organizationId } = await params;
  const { permissionName, value } = await req.json();

  const permission = await prisma.permission.findUnique({
    where: { name: permissionName },
  });

  if (!permission) return NextResponse.json({ error: "Permission not found" }, { status: 404 });

  const override = await prisma.orgPermissionOverride.upsert({
    where: { organizationId_permissionId: { organizationId, permissionId: permission.id } },
    update: { value },
    create: { organizationId, permissionId: permission.id, value },
  });

  return NextResponse.json(override);
}
