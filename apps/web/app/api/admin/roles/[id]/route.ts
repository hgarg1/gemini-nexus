import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { name, description, permissionIds } = await req.json();

    const role = await prisma.role.findUnique({ where: { id } });
    if (role?.isSystem && name !== role.name) {
      return NextResponse.json({ error: "Cannot rename system roles" }, { status: 400 });
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: {
          set: [], // Clear existing
          connect: (permissionIds || []).map((id: string) => ({ id })),
        },
      },
      include: { permissions: true },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (role?.isSystem) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 400 });
    }

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
