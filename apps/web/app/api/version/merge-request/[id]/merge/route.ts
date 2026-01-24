import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { computeDelta, materializeState, type CheckpointDelta } from "@repo/database";

const getChainIds = async (checkpointId: string) => {
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const strategy = typeof body.strategy === "string" ? body.strategy : "squash";

    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id },
      include: {
        chat: true,
        sourceBranch: true,
        targetBranch: true,
      },
    });
    if (!mergeRequest || mergeRequest.chat.userId !== (user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sourceHeadId = mergeRequest.sourceBranch.headId;
    const targetHeadId = mergeRequest.targetBranch.headId;

    if (!sourceHeadId) {
      return NextResponse.json({ error: "Source branch has no checkpoints" }, { status: 400 });
    }

    if (strategy === "fast-forward") {
      if (!targetHeadId) {
        await prisma.branch.update({
          where: { id: mergeRequest.targetBranchId },
          data: { headId: sourceHeadId },
        });
        await prisma.mergeRequest.update({
          where: { id },
          data: { status: "merged", mergeStrategy: "fast-forward", mergedCheckpointId: sourceHeadId },
        });
        return NextResponse.json({ status: "merged" });
      }

      const chainIds = await getChainIds(sourceHeadId);
      if (!chainIds.includes(targetHeadId)) {
        return NextResponse.json({ error: "Fast-forward not possible" }, { status: 400 });
      }

      await prisma.branch.update({
        where: { id: mergeRequest.targetBranchId },
        data: { headId: sourceHeadId },
      });
      await prisma.mergeRequest.update({
        where: { id },
        data: { status: "merged", mergeStrategy: "fast-forward", mergedCheckpointId: sourceHeadId },
      });
      return NextResponse.json({ status: "merged" });
    }

    const targetState = targetHeadId ? await materializeState(prisma, targetHeadId) : new Map();
    const sourceState = await materializeState(prisma, sourceHeadId);

    if (strategy === "rebase") {
      const ordered = await prisma.checkpoint.findMany({
        where: { branchId: mergeRequest.sourceBranchId },
        orderBy: { createdAt: "asc" },
      });

      let newHeadId = targetHeadId;
      for (const checkpoint of ordered) {
        const delta = checkpoint.delta as CheckpointDelta;
        const newCheckpoint = await prisma.checkpoint.create({
          data: {
            chatId: mergeRequest.chatId,
            branchId: mergeRequest.targetBranchId,
            label: checkpoint.label,
            summary: checkpoint.summary || undefined,
            comment: checkpoint.comment || undefined,
            delta,
            parentId: newHeadId || undefined,
            createdById: (user as any).id,
          },
        });
        newHeadId = newCheckpoint.id;
      }

      if (newHeadId) {
        await prisma.branch.update({
          where: { id: mergeRequest.targetBranchId },
          data: { headId: newHeadId },
        });
      }

      await prisma.mergeRequest.update({
        where: { id },
        data: { status: "merged", mergeStrategy: "rebase", mergedCheckpointId: newHeadId },
      });

      return NextResponse.json({ status: "merged" });
    }

    const delta = computeDelta(targetState, Array.from(sourceState.values()));
    if (delta.adds.length || delta.updates.length || delta.deletes.length) {
      const checkpoint = await prisma.checkpoint.create({
        data: {
          chatId: mergeRequest.chatId,
          branchId: mergeRequest.targetBranchId,
          label: `Merge ${mergeRequest.sourceBranch.name}`,
          summary: mergeRequest.title,
          comment: mergeRequest.description || undefined,
          delta,
          parentId: targetHeadId || undefined,
          createdById: (user as any).id,
        },
      });
      await prisma.branch.update({
        where: { id: mergeRequest.targetBranchId },
        data: { headId: checkpoint.id },
      });
      await prisma.mergeRequest.update({
        where: { id },
        data: { status: "merged", mergeStrategy: "squash", mergedCheckpointId: checkpoint.id },
      });
    } else {
      await prisma.mergeRequest.update({
        where: { id },
        data: { status: "merged", mergeStrategy: "squash" },
      });
    }

    return NextResponse.json({ status: "merged" });
  } catch (error: any) {
    console.error("MERGE_REQUEST_MERGE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
