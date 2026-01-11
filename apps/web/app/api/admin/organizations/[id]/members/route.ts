import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";

  if (!session?.user || !isAuthorized) {
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
