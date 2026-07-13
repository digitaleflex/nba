import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL?.trim();
const queueEnabled = process.env.QUEUE_ENABLED
  ? process.env.QUEUE_ENABLED === "true"
  : Boolean(redisUrl);

type JobLike = {
  remove: () => Promise<void>;
};

type QueueLike = {
  add: (
    name: string,
    data: unknown,
    opts?: unknown,
  ) => Promise<{ id: string | null }>;
  addBulk: (
    jobs: { name: string; data: unknown; opts?: unknown }[],
  ) => Promise<{ id: string | null }[]>;
  getJob: (id: string) => Promise<JobLike | null>;
};

function createNoopQueue(queueName: string): QueueLike {
  return {
    async add() {
      console.warn(`[queue:${queueName}] Redis/queue désactivé, job ignoré.`);
      return { id: null };
    },
    async addBulk(jobs) {
      console.warn(`[queue:${queueName}] Redis/queue désactivé, ${jobs.length} job(s) ignoré(s).`);
      return jobs.map(() => ({ id: null }));
    },
    async getJob() {
      return null;
    },
  };
}

function getRedisConnection() {
  if (!queueEnabled || !redisUrl) {
    return null;
  }

  const globalForRedis = globalThis as unknown as {
    redisConnection: IORedis | undefined;
  };

  if (!globalForRedis.redisConnection) {
    globalForRedis.redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  return globalForRedis.redisConnection;
}

function getQueue(name: string): QueueLike {
  const globalForQueues = globalThis as unknown as {
    queues: Record<string, QueueLike> | undefined;
  };

  if (!globalForQueues.queues) {
    globalForQueues.queues = {};
  }

  if (!globalForQueues.queues[name]) {
    const connection = getRedisConnection();
    const isNoop = !connection
    console.log(`[queue:${name}] Creating queue, isNoop=${isNoop}, redisUrl=${process.env.REDIS_URL ? "set" : "unset"}, queueEnabled=${process.env.QUEUE_ENABLED}`)

    if (!connection) {
      globalForQueues.queues[name] = createNoopQueue(name);
    } else {
      globalForQueues.queues[name] = new Queue(name, {
        connection: connection as unknown as never,
        skipVersionCheck: true,
      }) as unknown as QueueLike;
    }
  }

  return globalForQueues.queues[name];
}

export async function scheduleFileCleanup(type: "kyc" | "broker", id: string) {
  await fileCleanupQueue.add(
    `cleanup-${type}-${id}`,
    { type, id },
    { delay: 7 * 24 * 60 * 60 * 1000 },
  );
}

export const fileCleanupQueue = getQueue("file-cleanup");
export const signalDistributionQueue = getQueue("signal-distribution");
export const notificationDeliveryQueue = getQueue("notification-delivery");
export { getRedisConnection, getQueue, queueEnabled };
