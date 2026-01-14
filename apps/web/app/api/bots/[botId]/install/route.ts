import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function POST(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const userId = (session.user as any).id;
  const { botId } = await params; // Destructure after awaiting

  try {
    // 1. Check Policy Limits
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            memberships: { include: { organization: true } },
            installedBots: true 
        }
    });

    const activeOrg = user?.memberships.find(m => m.organizationId === user.activeOrgId)?.organization;
    const policy = activeOrg?.nexusPolicy as any;
    
    if (policy && policy.maxInstalledBots && user?.installedBots.length! >= policy.maxInstalledBots) {
        return NextResponse.json({ error: "Installation limit reached by organization policy." }, { status: 403 });
    }

    // 2. Install Bot
    await prisma.userBotLibrary.create({
        data: {
            userId,
            botId
        }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to install agent." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  
    const userId = (session.user as any).id;
    const { botId } = await params;
  
    try {
      await prisma.userBotLibrary.deleteMany({
          where: {
              userId,
              botId
          }
      });
  
      return NextResponse.json({ success: true });
  
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to uninstall agent." }, { status: 500 });
    }
  }
