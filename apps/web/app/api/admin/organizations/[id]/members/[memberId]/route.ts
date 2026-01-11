import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";

  if (!session?.user || !isAuthorized) {
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
        userId: (session.user as any).id,
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
