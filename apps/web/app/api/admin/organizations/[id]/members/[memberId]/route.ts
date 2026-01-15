import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: organizationId, memberId } = await params;

  try {
    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberId,
        },
      },
    });

    // Log action
    await prisma.usageLog.create({
      data: {
        userId: context.user.id,
        action: "admin_org_member_remove",
        resource: memberId,
        details: { organizationId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MEMBER_REMOVE_ERROR", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
