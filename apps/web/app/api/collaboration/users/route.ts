import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const query = req.nextUrl.searchParams.get("q")?.trim() || "";

  const connections = await prisma.userConnection.findMany({
    where: {
      OR: [{ requesterId: userId }, { targetId: userId }],
    },
  });

  const statusByUser = new Map<string, { status: string; direction: "out" | "in" }>();
  connections.forEach((conn) => {
    const otherId = conn.requesterId === userId ? conn.targetId : conn.requesterId;
    statusByUser.set(otherId, {
      status: conn.status,
      direction: conn.requesterId === userId ? "out" : "in",
    });
  });

  const users = await prisma.user.findMany({
    where: query
      ? {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        }
      : { id: { not: userId } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, name: true, email: true, image: true },
  });

  const enriched = users.map((u) => {
    const status = statusByUser.get(u.id);
    let connection = "none";
    if (status) {
      if (status.status === "BLOCKED") {
        connection = status.direction === "out" ? "blocked" : "blocked_by";
      } else if (status.status === "PENDING") {
        connection = status.direction === "out" ? "outgoing" : "incoming";
      } else if (status.status === "ACCEPTED") {
        connection = "friend";
      }
    }
    return { ...u, connection };
  });

  return NextResponse.json({ users: enriched });
}
