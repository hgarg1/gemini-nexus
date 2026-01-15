import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (sessionUser as any).id;

  const connections = await prisma.userConnection.findMany({
    where: {
      OR: [
        { requesterId: userId, status: "ACCEPTED" },
        { targetId: userId, status: "ACCEPTED" },
      ],
    },
    include: {
      requester: { select: { id: true, name: true, image: true } },
      target: { select: { id: true, name: true, image: true } },
    },
  });

  const connectionUsers = connections.map((conn) => 
    conn.requesterId === userId ? conn.target : conn.requester
  );

  // Also fetch users we have exchanged messages with, even if not connected
  const dms = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
    select: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
    distinct: ["senderId", "receiverId"],
  });

  const dmUsers = dms.flatMap(dm => [dm.sender, dm.receiver])
    .filter(u => u.id !== userId);

  // Merge and deduplicate
  const allUsersMap = new Map();
  [...connectionUsers, ...dmUsers].forEach(u => {
    if (!allUsersMap.has(u.id)) {
      allUsersMap.set(u.id, u);
    }
  });

  return NextResponse.json({ connections: Array.from(allUsersMap.values()) });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (sessionUser as any).id;
  const { targetUserId, action } = await req.json();

  if (!targetUserId || typeof targetUserId !== "string" || targetUserId === userId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const { policy } = await getEffectiveChatPolicy(userId);
  if (!policy.allowFriendRequests && ["request", "accept", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Friend requests disabled by policy" }, { status: 403 });
  }

  const existing = await prisma.userConnection.findFirst({
    where: {
      OR: [
        { requesterId: userId, targetId: targetUserId },
        { requesterId: targetUserId, targetId: userId },
      ],
    },
  });

  if (action === "request") {
    if (existing?.status === "BLOCKED") {
      return NextResponse.json({ error: "Connection blocked" }, { status: 403 });
    }
    if (existing) {
      return NextResponse.json({ error: "Connection already exists" }, { status: 400 });
    }
    const created = await prisma.userConnection.create({
      data: {
        requesterId: userId,
        targetId: targetUserId,
        status: "PENDING",
      },
    });
    return NextResponse.json({ connection: created });
  }

  if (action === "accept") {
    if (!existing || existing.status !== "PENDING" || existing.requesterId !== targetUserId) {
      return NextResponse.json({ error: "No pending request" }, { status: 400 });
    }
    const updated = await prisma.userConnection.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ connection: updated });
  }

  if (action === "cancel") {
    if (!existing || existing.status !== "PENDING" || existing.requesterId !== userId) {
      return NextResponse.json({ error: "No outgoing request" }, { status: 400 });
    }
    await prisma.userConnection.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  }

  if (action === "remove") {
    if (!existing) {
      return NextResponse.json({ error: "No connection found" }, { status: 404 });
    }
    await prisma.userConnection.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  }

  if (action === "block") {
    if (existing) {
      await prisma.userConnection.delete({ where: { id: existing.id } });
    }
    const blocked = await prisma.userConnection.create({
      data: {
        requesterId: userId,
        targetId: targetUserId,
        status: "BLOCKED",
      },
    });
    return NextResponse.json({ connection: blocked });
  }

  if (action === "unblock") {
    if (!existing || existing.status !== "BLOCKED" || existing.requesterId !== userId) {
      return NextResponse.json({ error: "No block found" }, { status: 404 });
    }
    await prisma.userConnection.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
