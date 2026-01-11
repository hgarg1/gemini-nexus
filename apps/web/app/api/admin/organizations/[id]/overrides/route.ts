import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: organizationId } = await params;

  const overrides = await prisma.orgPermissionOverride.findMany({
    where: { organizationId },
    include: { permission: true },
  });

  return NextResponse.json({ overrides });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: organizationId } = await params;
  const { permissionName, value } = await req.json();

  const permission = await prisma.permission.findUnique({
    where: { name: permissionName },
  });

  if (!permission) return NextResponse.json({ error: "Permission not found" }, { status: 404 });

  const override = await prisma.orgPermissionOverride.upsert({
    where: { organizationId_permissionId: { organizationId, permissionId: permission.id } },
    update: { value },
    create: { organizationId, permissionId: permission.id, value },
  });

  return NextResponse.json(override);
}
