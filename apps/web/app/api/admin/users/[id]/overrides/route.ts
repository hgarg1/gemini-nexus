import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function POST(
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
    const { permissionId, permissionName, value } = await req.json();

    let targetPermissionId = permissionId;

    if (!targetPermissionId && permissionName) {
        const p = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (!p) return NextResponse.json({ error: "Permission not found" }, { status: 404 });
        targetPermissionId = p.id;
    }

    if (!targetPermissionId) return NextResponse.json({ error: "Permission identifier required" }, { status: 400 });

    const override = await prisma.permissionOverride.upsert({
      where: { userId_permissionId: { userId: id, permissionId: targetPermissionId } },
      update: { value },
      create: { userId: id, permissionId: targetPermissionId, value },
    });

    return NextResponse.json(override);
  } catch (error) {
    console.error("OVERRIDE_ERROR", error);
    return NextResponse.json({ error: "Failed to set override" }, { status: 500 });
  }
}

export async function DELETE(
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
    const { permissionId, permissionName } = await req.json();

    let targetPermissionId = permissionId;

    if (!targetPermissionId && permissionName) {
        const p = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (!p) return NextResponse.json({ error: "Permission not found" }, { status: 404 });
        targetPermissionId = p.id;
    }

    if (!targetPermissionId) return NextResponse.json({ error: "Permission identifier required" }, { status: 400 });

    await prisma.permissionOverride.delete({
      where: { userId_permissionId: { userId: id, permissionId: targetPermissionId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove override" }, { status: 500 });
  }
}