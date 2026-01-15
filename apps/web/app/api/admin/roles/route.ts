import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roles = await prisma.role.findMany({
    include: { permissions: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, description, permissionIds } = await req.json();

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          connect: (permissionIds || []).map((id: string) => ({ id })),
        },
      },
      include: { permissions: true },
    });

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
