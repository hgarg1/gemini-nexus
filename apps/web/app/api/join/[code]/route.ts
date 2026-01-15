import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const link = await prisma.organizationLink.findUnique({
    where: { code, active: true },
    include: { organization: true }
  });

  if (!link) return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link has expired." }, { status: 410 });
  }

  if (link.maxUses && link.useCount >= link.maxUses) {
    return NextResponse.json({ error: "Link use limit reached." }, { status: 410 });
  }

  return NextResponse.json({ organization: link.organization, requiresApproval: link.requiresApproval });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { code } = await params;
  const userId = (user as any).id;

  const link = await prisma.organizationLink.findUnique({
    where: { code, active: true },
  });

  if (!link) return NextResponse.json({ error: "Invalid link." }, { status: 404 });

  // 1. Check if already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: link.organizationId, userId } }
  });
  if (existingMember) return NextResponse.json({ error: "You are already a member of this sector." }, { status: 400 });

  // 2. Increment use count
  await prisma.organizationLink.update({
    where: { id: link.id },
    data: { useCount: { increment: 1 } }
  });

  if (link.requiresApproval) {
    // 3. Create join request
    await prisma.organizationJoinRequest.upsert({
      where: { organizationId_userId: { organizationId: link.organizationId, userId } },
      update: { status: "PENDING" },
      create: {
        organizationId: link.organizationId,
        userId,
        roleId: link.roleId,
        status: "PENDING"
      }
    });
    return NextResponse.json({ status: "PENDING_APPROVAL" });
  } else {
    // 4. Join immediately
    await prisma.organizationMember.create({
      data: {
        organizationId: link.organizationId,
        userId,
        roleId: link.roleId,
      }
    });
    return NextResponse.json({ status: "JOINED" });
  }
}
