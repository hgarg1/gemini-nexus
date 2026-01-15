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
    const { name, description } = await req.json();

    const updated = await prisma.permission.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
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
    await prisma.permission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 });
  }
}
