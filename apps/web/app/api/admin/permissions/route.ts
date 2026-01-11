import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const perms = await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ permissions: perms });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
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