import type { PrismaClient } from "@prisma/client";

export type VersionedAsset = {
  url: string;
  role: string;
};

export type VersionedMessage = {
  id: string;
  role: string;
  content: string;
  assets: VersionedAsset[];
};

export type CheckpointDelta = {
  adds: VersionedMessage[];
  updates: VersionedMessage[];
  deletes: string[];
};

const normalizeAssets = (assets: any[]) =>
  (assets || [])
    .filter((asset) => typeof asset?.url === "string")
    .map((asset) => ({ url: asset.url, role: asset.role || "user" }))
    .sort((a, b) => a.url.localeCompare(b.url));

export const normalizeMessage = (message: any): VersionedMessage => ({
  id: message.id,
  role: message.role,
  content: message.content,
  assets: normalizeAssets(message.assets),
});

const assetsSignature = (assets: VersionedAsset[]) =>
  assets.map((asset) => `${asset.role}:${asset.url}`).join("|");

export const computeDelta = (
  baseState: Map<string, VersionedMessage>,
  currentMessages: VersionedMessage[]
): CheckpointDelta => {
  const currentMap = new Map(currentMessages.map((m) => [m.id, m]));
  const adds: VersionedMessage[] = [];
  const updates: VersionedMessage[] = [];
  const deletes: string[] = [];

  currentMap.forEach((message, id) => {
    const base = baseState.get(id);
    if (!base) {
      adds.push(message);
      return;
    }
    const contentChanged = base.content !== message.content || base.role !== message.role;
    const assetsChanged = assetsSignature(base.assets) !== assetsSignature(message.assets);
    if (contentChanged || assetsChanged) {
      updates.push(message);
    }
  });

  baseState.forEach((_message, id) => {
    if (!currentMap.has(id)) {
      deletes.push(id);
    }
  });

  return { adds, updates, deletes };
};

export const applyDelta = (
  state: Map<string, VersionedMessage>,
  delta: CheckpointDelta
) => {
  delta.adds.forEach((message) => {
    state.set(message.id, message);
  });
  delta.updates.forEach((message) => {
    state.set(message.id, message);
  });
  delta.deletes.forEach((id) => {
    state.delete(id);
  });
  return state;
};

export const loadCheckpointChain = async (
  prisma: PrismaClient,
  checkpointId: string
) => {
  const chain: any[] = [];
  let currentId: string | null = checkpointId;

  while (currentId) {
    const node: any = await prisma.checkpoint.findUnique({
      where: { id: currentId },
    });
    if (!node) break;
    chain.unshift(node);
    currentId = node.parentId;
  }

  return chain;
};

export const materializeState = async (
  prisma: PrismaClient,
  checkpointId: string
) => {
  const chain = await loadCheckpointChain(prisma, checkpointId);
  const state = new Map<string, VersionedMessage>();

  chain.forEach((checkpoint) => {
    const delta = checkpoint.delta as CheckpointDelta;
    applyDelta(state, {
      adds: delta.adds || [],
      updates: delta.updates || [],
      deletes: delta.deletes || [],
    });
  });

  return state;
};
