import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const perms = await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ permissions: perms });
}

export async function POST(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, description } = await req.json();

    const perm = await prisma.permission.create({
      data: { name, description },
    });

    return NextResponse.json(perm);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
  }
}
