import { Queue } from "bullmq";
import { Redis } from "ioredis";

let transmissionQueue: Queue | null = null;
let connection: Redis | null = null;

export function getTransmissionQueue() {
  if (transmissionQueue) {
    return transmissionQueue;
  }

  const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

  // Prevent connection during build time if env var not set or explicitly disabled
  if (process.env.NEXT_PHASE === 'phase-production-build') {
     return null;
  }

  if (!connection) {
      connection = new Redis(REDIS_URL, { 
          maxRetriesPerRequest: null,
          // Add lazyConnect to true to avoid immediate connection if not needed? 
          // ioredis connects immediately by default. 
          // However, since we are inside a function, this only runs when called.
      });
  }

  transmissionQueue = new Queue("transmission-queue", { connection: connection as any });
  return transmissionQueue;
}
