import { describe, it, expect, vi } from "vitest"
import { retryFailedJobs, type QueueLike } from "./queue"

function fakeQueue(counts: Record<string, number>) {
  return {
    add: vi.fn(),
    addBulk: vi.fn(),
    getJob: vi.fn(),
    getJobCounts: vi.fn(async () => counts),
    retryJobs: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  } as unknown as QueueLike
}

describe("retryFailedJobs", () => {
  it("ne touche à rien quand aucun job n'est en échec", async () => {
    const queue = fakeQueue({ failed: 0 })

    const count = await retryFailedJobs(queue)

    expect(count).toBe(0)
    expect(queue.getJobCounts).toHaveBeenCalledWith("failed")
    expect(queue.retryJobs).not.toHaveBeenCalled()
  })

  it("relance les jobs en échec via l'API BullMQ et retourne le compte", async () => {
    const queue = fakeQueue({ failed: 7 })

    const count = await retryFailedJobs(queue)

    expect(count).toBe(7)
    expect(queue.retryJobs).toHaveBeenCalledTimes(1)
    expect(queue.retryJobs).toHaveBeenCalledWith({ state: "failed" })
  })
})
