import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== "admin") {
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
