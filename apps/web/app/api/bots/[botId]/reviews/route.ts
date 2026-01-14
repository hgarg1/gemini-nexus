import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  try {
    const reviews = await prisma.botReview.findMany({
      where: { botId: params.botId },
      include: {
        user: { select: { name: true, image: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { botId } = await params;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  try {
    // Upsert review
    const review = await prisma.botReview.upsert({
      where: { botId_userId: { botId: params.botId, userId } },
      update: { rating, comment },
      create: { botId: params.botId, userId, rating, comment }
    });

    // Update Bot aggregate stats
    const aggregates = await prisma.botReview.aggregate({
      where: { botId: params.botId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await prisma.bot.update({
      where: { id: params.botId },
      data: {
        avgRating: aggregates._avg.rating || 0,
        reviewCount: aggregates._count.rating || 0
      }
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to post review" }, { status: 500 });
  }
}
