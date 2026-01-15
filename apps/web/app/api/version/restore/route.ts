import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { computeDelta, loadCheckpointChain, materializeState, type CheckpointDelta } from "@/lib/versioning";

const collectChainIds = async (checkpointId: string) => {
  const ids: string[] = [];
  let currentId: string | null = checkpointId;
  while (currentId) {
    ids.push(currentId);
    const currentCheckpoint: any = await prisma.checkpoint.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!currentCheckpoint?.parentId) break;
    currentId = currentCheckpoint.parentId;
  }
  return ids;
};

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const chatId = typeof body.chatId === "string" ? body.chatId : "";
    const branchId = typeof body.branchId === "string" ? body.branchId : "";
    const checkpointId = typeof body.checkpointId === "string" ? body.checkpointId : "";
    const strategy = typeof body.strategy === "string" ? body.strategy : "squash";

    if (!chatId || !branchId || !checkpointId) {
      return NextResponse.json({ error: "chatId, branchId, checkpointId required" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });
    if (!chat || chat.userId !== (user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch || branch.chatId !== chatId) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });
    if (!checkpoint || checkpoint.chatId !== chatId) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }

    const targetHeadId = branch.headId || branch.baseCheckpointId || null;

    if (strategy === "fast-forward") {
      if (targetHeadId) {
        const chainIds = await collectChainIds(targetHeadId);
        if (!chainIds.includes(checkpointId)) {
          return NextResponse.json({ error: "Fast-forward not possible" }, { status: 400 });
        }
      }

      await prisma.branch.update({
        where: { id: branchId },
        data: { headId: checkpointId },
      });

      return NextResponse.json({ status: "restored", strategy: "fast-forward", headId: checkpointId });
    }

    if (strategy === "rebase") {
      const chain = await loadCheckpointChain(prisma, checkpointId);
      let newHeadId: string | null = targetHeadId;

      for (const node of chain) {
        const delta = node.delta as CheckpointDelta;
        const newCheckpoint = await prisma.checkpoint.create({
          data: {
            chatId,
            branchId,
            label: node.label,
            summary: node.summary || undefined,
            comment: node.comment || undefined,
            delta,
            parentId: newHeadId || undefined,
            createdById: (user as any).id,
          },
        });
        newHeadId = newCheckpoint.id;
      }

      if (newHeadId) {
        await prisma.branch.update({
          where: { id: branchId },
          data: { headId: newHeadId },
        });
      }

      return NextResponse.json({ status: "restored", strategy: "rebase", headId: newHeadId });
    }

    const targetState = targetHeadId ? await materializeState(prisma, targetHeadId) : new Map();
    const restoreState = await materializeState(prisma, checkpointId);
    const delta = computeDelta(targetState, Array.from(restoreState.values()));

    if (!delta.adds.length && !delta.updates.length && !delta.deletes.length) {
      return NextResponse.json({ error: "No changes to restore" }, { status: 400 });
    }

    const newCheckpoint = await prisma.checkpoint.create({
      data: {
        chatId,
        branchId,
        label: `Restore ${checkpoint.label}`,
        comment: `Restored from ${checkpoint.id.slice(-6)}`,
        delta,
        parentId: targetHeadId || undefined,
        createdById: (user as any).id,
      },
    });

    await prisma.branch.update({
      where: { id: branchId },
      data: { headId: newCheckpoint.id },
    });

    return NextResponse.json({ status: "restored", strategy: "squash", headId: newCheckpoint.id });
  } catch (error: any) {
    console.error("VERSION_RESTORE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
