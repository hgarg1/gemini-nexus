import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roles = await prisma.role.findMany({
    include: { permissions: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ roles });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
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
