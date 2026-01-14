import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");

  try {
    const where: any = {
      OR: [
        { creatorId: (session.user as any).id },
        { isPublic: true }
      ]
    };

    if (tag && tag !== "All") {
        where.tags = { has: tag };
    }

    const bots = await prisma.bot.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        usage: true
      }
    });

    return NextResponse.json({ bots });
  } catch (error) {
    console.error("[BOTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { z } from "zod";

const botSchema = z.object({
  name: z.string().min(2, "Name is required (min 2 chars)"),
  description: z.string().optional(),
  systemInstruction: z.string().min(10, "System instruction is required (min 10 chars)"),
  isPublic: z.boolean().optional(),
  config: z.any().optional(),
  skills: z.array(z.string()).optional(),
  appearance: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = botSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(JSON.stringify({ errors: validation.error.format() }), { status: 400 });
    }

    const { name, description, systemInstruction, isPublic, config, skills, appearance, tags } = validation.data;

    const bot = await prisma.bot.create({
      data: {
        name,
        description,
        systemInstruction,
        isPublic: isPublic || false,
        config: config || {},
        skills: skills || [],
        appearance: appearance || {},
        tags: tags || [],
        creatorId: (session.user as any).id,
        status: "DRAFT",
        usage: {
            create: {
                interactionCount: 0,
                tokenCount: 0
            }
        }
      }
    });

    return NextResponse.json({ bot });
  } catch (error) {
    console.error("[BOTS_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}