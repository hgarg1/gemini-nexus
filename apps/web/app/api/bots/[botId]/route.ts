import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { usage: true, reviews: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 } }
    });

    if (!bot) return new NextResponse("Bot not found", { status: 404 });

    // Check access
    if (bot.creatorId !== (session.user as any).id && !bot.isPublic) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json({ bot });
  } catch (error) {
    console.error("[BOT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ botId: string }> }) {
    const { botId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  
    try {
      const body = await req.json();
      const { name, description, systemInstruction, isPublic, config, status, skills, appearance, tags } = body;

      const bot = await prisma.bot.findUnique({
        where: { id: botId },
      });

      if (!bot) return new NextResponse("Bot not found", { status: 404 });
      if (bot.creatorId !== (session.user as any).id) {
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

export async function DELETE(req: Request, { params }: { params: Promise<{ botId: string }> }) {
    const { botId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const bot = await prisma.bot.findUnique({
            where: { id: botId },
        });

        if (!bot) return new NextResponse("Bot not found", { status: 404 });
        
        const isAdmin = (session.user as any).role === "admin";

        if (bot.creatorId !== (session.user as any).id && !isAdmin) {
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