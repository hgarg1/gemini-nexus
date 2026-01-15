import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: organizationId } = await params;

  const requests = await prisma.organizationJoinRequest.findMany({
    where: { organizationId, status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: organizationId } = await params;
  const { requestId, action } = await req.json(); // action: 'APPROVE' | 'REJECT'

  const request = await prisma.organizationJoinRequest.findUnique({
    where: { id: requestId },
    include: { user: true }
  });

  if (!request || request.organizationId !== organizationId) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (action === "APPROVE") {
    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          organizationId,
          userId: request.userId,
          roleId: request.roleId,
        },
      }),
      prisma.organizationJoinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      }),
    ]);
  } else {
    await prisma.organizationJoinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
  }

  return NextResponse.json({ success: true });
}
