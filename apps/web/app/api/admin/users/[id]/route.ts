import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

// PATCH: Update user role or ban status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAdminContext(req);
    if (!context || !isAdminRole(context.roleName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { role, roleId, isBanned } = body;

    const data: any = {};
    if (role !== undefined) data.role = role;
    if (roleId !== undefined) data.roleId = roleId;
    if (isBanned !== undefined) data.isBanned = isBanned;

    // Prevent self-ban/self-demote
    if (id === context.user.id) {
        if (data.isBanned) return NextResponse.json({ error: "Cannot ban self" }, { status: 400 });
        if (data.role && data.role !== "admin") return NextResponse.json({ error: "Cannot demote self" }, { status: 400 });
        if (data.roleId) {
          const targetRole = await prisma.role.findUnique({ where: { id: data.roleId }, select: { name: true } });
          if (targetRole?.name !== "Super Admin" && targetRole?.name !== "Admin") {
            return NextResponse.json({ error: "Cannot demote self" }, { status: 400 });
          }
        }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // Log this action
    await prisma.usageLog.create({
      data: {
        userId: context.user.id,
        action: "admin_user_update",
        resource: id,
        details: data,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("ADMIN_USER_UPDATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAdminContext(req);
    if (!context || !isAdminRole(context.roleName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    if (id === context.user.id) {
        return NextResponse.json({ error: "Cannot delete self" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    await prisma.usageLog.create({
        data: {
          userId: context.user.id,
          action: "admin_user_delete",
          resource: id,
        },
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ADMIN_USER_DELETE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
