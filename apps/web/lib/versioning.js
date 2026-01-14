const normalizeAssets = (assets) => (assets || [])
    .filter((asset) => typeof asset?.url === "string")
    .map((asset) => ({ url: asset.url, role: asset.role || "user" }))
    .sort((a, b) => a.url.localeCompare(b.url));
export const normalizeMessage = (message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    assets: normalizeAssets(message.assets),
});
const assetsSignature = (assets) => assets.map((asset) => `${asset.role}:${asset.url}`).join("|");
export const computeDelta = (baseState, currentMessages) => {
    const currentMap = new Map(currentMessages.map((m) => [m.id, m]));
    const adds = [];
    const updates = [];
    const deletes = [];
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
export const applyDelta = (state, delta) => {
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
export const loadCheckpointChain = async (prisma, checkpointId) => {
    const chain = [];
    let currentId = checkpointId;
    while (currentId) {
        const node = await prisma.checkpoint.findUnique({
            where: { id: currentId },
        });
        if (!node)
            break;
        chain.unshift(node);
        currentId = node.parentId;
    }
    return chain;
};
export const materializeState = async (prisma, checkpointId) => {
    const chain = await loadCheckpointChain(prisma, checkpointId);
    const state = new Map();
    chain.forEach((checkpoint) => {
        const delta = checkpoint.delta;
        applyDelta(state, {
            adds: delta.adds || [],
            updates: delta.updates || [],
            deletes: delta.deletes || [],
        });
    });
    return state;
};
