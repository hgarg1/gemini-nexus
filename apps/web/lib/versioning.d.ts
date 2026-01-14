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
export declare const normalizeMessage: (message: any) => VersionedMessage;
export declare const computeDelta: (baseState: Map<string, VersionedMessage>, currentMessages: VersionedMessage[]) => CheckpointDelta;
export declare const applyDelta: (state: Map<string, VersionedMessage>, delta: CheckpointDelta) => Map<string, VersionedMessage>;
export declare const loadCheckpointChain: (prisma: PrismaClient, checkpointId: string) => Promise<any[]>;
export declare const materializeState: (prisma: PrismaClient, checkpointId: string) => Promise<Map<string, VersionedMessage>>;
//# sourceMappingURL=versioning.d.ts.map