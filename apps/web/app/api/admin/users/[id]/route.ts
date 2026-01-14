import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

// PATCH: Update user role or ban status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";
    if (!session?.user || !isAuthorized) {
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
    if (id === (session.user as any).id) {
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
        userId: (session.user as any).id,
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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";
    if (!session?.user || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    if (id === (session.user as any).id) {
        return NextResponse.json({ error: "Cannot delete self" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    await prisma.usageLog.create({
        data: {
          userId: (session.user as any).id,
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
