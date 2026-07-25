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

let queueConnAvailable = true
let queueConnUnavailableUntil = 0

function getRedisConnection() {
  if (!queueEnabled || !redisUrl) {
    return null;
  }

  if (!queueConnAvailable) {
    if (Date.now() < queueConnUnavailableUntil) return null
    queueConnAvailable = true
  }

  const globalForRedis = globalThis as unknown as {
    redisConnection: IORedis | undefined;
  };

  if (!globalForRedis.redisConnection) {
    globalForRedis.redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      connectTimeout: 5000,
      commandTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 10) {
          console.error(`[queue] Redis unavailable after ${times} retries, cooling down for 30s`)
          queueConnAvailable = false
          queueConnUnavailableUntil = Date.now() + 30000
          return null
        }
        return Math.min(times * 200, 2000)
      },
    });

    globalForRedis.redisConnection.on("error", (err) => {
      console.error("[queue] Redis connection error:", err.message)
    })
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
export const pushDeliveryQueue = getQueue("push-delivery");
export const deadLetterQueue = getQueue("dead-letter");
export const recoveryQueue = getQueue("recovery");
export { getRedisConnection, getQueue, queueEnabled };
