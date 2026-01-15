import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

const resolveUser = async (req: NextRequest) => {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return null;
  const userRecord = await prisma.user.findUnique({
    where: { id: (sessionUser as any).id },
    select: { id: true, role: true, userRole: { select: { name: true } } },
  });
  if (!userRecord) return null;
  const roleName = userRecord.userRole?.name || userRecord.role || "";
  const isAdmin = roleName === "admin" || roleName === "Admin" || roleName === "Super Admin";
  return { id: userRecord.id, isAdmin };
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const user = await resolveUser(req);
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { usage: true, reviews: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 } }
    });

    if (!bot) return new NextResponse("Bot not found", { status: 404 });

    // Check access
    if (bot.creatorId !== user.id && !bot.isPublic) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json({ bot });
  } catch (error) {
    console.error("[BOT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
    const { botId } = await params;
    const user = await resolveUser(req);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  
    try {
      const body = await req.json();
      const { name, description, systemInstruction, isPublic, config, status, skills, appearance, tags } = body;

      const bot = await prisma.bot.findUnique({
        where: { id: botId },
      });

      if (!bot) return new NextResponse("Bot not found", { status: 404 });
      if (bot.creatorId !== user.id) {
          return new NextResponse("Forbidden", { status: 403 });
      }
  
      const updatedBot = await prisma.bot.update({
        where: { id: botId },
        data: {
          name,
          description,
          systemInstruction,
          isPublic,
          config,
          status,
          skills,
          appearance,
          tags
        }
      });
  
      return NextResponse.json({ bot: updatedBot });
    } catch (error) {
      console.error("[BOT_UPDATE]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
    const { botId } = await params;
    const user = await resolveUser(req);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const bot = await prisma.bot.findUnique({
            where: { id: botId },
        });

        if (!bot) return new NextResponse("Bot not found", { status: 404 });
        
        if (bot.creatorId !== user.id && !user.isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.bot.delete({
            where: { id: botId }
        });

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.error("[BOT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
