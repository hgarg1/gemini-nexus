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

  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: { 
        user: { select: { id: true, name: true, email: true, image: true } },
        role: { select: { name: true } }
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
