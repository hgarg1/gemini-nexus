import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const bots = await prisma.bot.findMany({
      include: {
        creator: {
            select: { name: true, email: true, image: true }
        },
        usage: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ bots });
  } catch (error) {
    console.error("[ADMIN_BOTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
