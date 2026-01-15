import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await req.json();
  const requesterId = (sessionUser as any).id;

  if (!targetUserId) {
    return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
  }

  // 1. Fetch Requester and Target details
  const [requester, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: requesterId } }),
    prisma.user.findUnique({ where: { id: targetUserId } }),
  ]);

  if (!requester || !target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Check: User cannot block Admin
  if (target.role === "admin" || target.role === "Super Admin") {
    return NextResponse.json({ error: "Cannot block administrative personnel." }, { status: 403 });
  }

  // 3. Check: User has blocking privileges
  if (!requester.canBlockOthers) {
    return NextResponse.json({ error: "Your blocking privileges have been suspended." }, { status: 403 });
  }

  // 4. Check: Target is not in restricted list
  if (requester.restrictedBlockIds.includes(targetUserId)) {
    return NextResponse.json({ error: "You are restricted from blocking this specific user." }, { status: 403 });
  }

  // 5. Execute Block (Update or Create Connection)
  const existingConnection = await prisma.userConnection.findFirst({
    where: {
      OR: [
        { requesterId, targetId: targetUserId },
        { requesterId: targetUserId, targetId: requesterId },
      ],
    },
  });

  if (existingConnection) {
    // If the other person requested, we need to flip it so we are the requester of the block? 
    // Or just mark status blocked? 
    // Usually 'blocked' implies the relationship is severed.
    // Ideally we store *who* blocked. 
    // For this simple schema, status "BLOCKED" might be ambiguous. 
    // Let's assume if status is BLOCKED, the relationship is dead.
    // If we need to know WHO blocked, we'd need a field. 
    // For now, I'll delete the old connection and create a new one where requester is the one blocking.
    await prisma.userConnection.delete({ where: { id: existingConnection.id } });
  }

  await prisma.userConnection.create({
    data: {
      requesterId,
      targetId: targetUserId,
      status: "BLOCKED",
    },
  });

  // 6. Log to Audit
  await prisma.usageLog.create({
    data: {
      userId: requesterId,
      action: "user_block",
      resource: targetUserId,
      details: { targetEmail: target.email, reason: "User initiated block" },
    },
  });

  return NextResponse.json({ success: true });
}
