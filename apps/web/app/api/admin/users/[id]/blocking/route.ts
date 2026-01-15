import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { canBlockOthers, restrictedBlockIds, canViewBlockLogs } = await req.json();

  const data: any = {};
  if (typeof canBlockOthers === "boolean") data.canBlockOthers = canBlockOthers;
  if (typeof canViewBlockLogs === "boolean") data.canViewBlockLogs = canViewBlockLogs;
  if (Array.isArray(restrictedBlockIds)) data.restrictedBlockIds = restrictedBlockIds;

  await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true });
}
