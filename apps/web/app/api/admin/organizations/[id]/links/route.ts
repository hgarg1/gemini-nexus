import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: organizationId } = await params;

  const links = await prisma.organizationLink.findMany({
    where: { organizationId },
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ links });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: organizationId } = await params;
  const { label, roleId, requiresApproval, maxUses, expiresAt, isPrimary } = await req.json();

  const link = await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.organizationLink.updateMany({
        where: { organizationId, isPrimary: true },
        data: { isPrimary: false }
      });
    }
    return tx.organizationLink.create({
      data: {
        organizationId,
        label,
        roleId,
        requiresApproval: requiresApproval ?? true,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPrimary: !!isPrimary
      },
      include: { role: true },
    });
  });

  return NextResponse.json(link);
}
