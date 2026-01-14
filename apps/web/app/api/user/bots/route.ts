import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Fetch Created Bots
    const createdBots = await prisma.bot.findMany({
      where: { creatorId: userId },
      select: { id: true, name: true, description: true, avatar: true }
    });

    // Fetch Installed Bots
    const installed = await prisma.userBotLibrary.findMany({
        where: { userId },
        include: { bot: { select: { id: true, name: true, description: true, avatar: true } } }
    });

    const installedBots = installed.map(i => i.bot);

    // Merge and Dedupe
    const allBots = [...createdBots, ...installedBots].filter((bot, index, self) => 
        index === self.findIndex((b) => b.id === bot.id)
    );

    return NextResponse.json({ bots: allBots });
  } catch (error) {
    console.error("[USER_BOTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
