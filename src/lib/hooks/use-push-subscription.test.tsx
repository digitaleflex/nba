// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePushSubscription } from "./use-push-subscription"

describe("usePushSubscription", () => {
  beforeEach(() => {
    // Reset globals
    (globalThis as any).Notification = { permission: "default", requestPermission: vi.fn(async () => "granted") }
    ;(globalThis as any).navigator = {
      userAgent: "Mozilla/5.0 (Windows NT 10.0)",
      serviceWorker: {
        register: vi.fn(async () => ({ pushManager: { subscribe: vi.fn(async () => ({ endpoint: "https://push/1", toJSON: () => ({ keys: { p256dh: "p", auth: "a" } }) })) }, ready: Promise.resolve({ pushManager: { subscribe: vi.fn() } }) })),
        getRegistration: vi.fn(async () => null),
        ready: Promise.resolve({ pushManager: { getSubscription: vi.fn(async () => null), subscribe: vi.fn() } }),
      },
      standalone: false,
    }
    ;(globalThis as any).window = { matchMedia: () => ({ matches: false }), atob: (s: string) => s, PushManager: function () {}, Notification: (globalThis as any).Notification }
    global.fetch = vi.fn(async (url: any) => {
      if (String(url).includes("vapid-key")) return { ok: true, json: async () => ({ publicKey: "dGVzdA==" }) }
      return { ok: true, json: async () => ({}) }
    }) as any
  })

  it("iOS non installé → ios-install", async () => {
    Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)", writable: true })
    Object.defineProperty(navigator, "platform", { value: "iPhone", writable: true })
    Object.defineProperty(navigator, "maxTouchPoints", { value: 5, writable: true })
    const { result } = renderHook(() => usePushSubscription())
    await act(async () => {})
    expect(result.current.state).toBe("ios-install")
  })

  it("refus → denied", async () => {
    ;(Notification as any).requestPermission = vi.fn(async () => "denied")
    const { result } = renderHook(() => usePushSubscription())
    await act(async () => { await result.current.enable() })
    expect(result.current.state).toBe("denied")
  })

  it("accord → active", async () => {
    ;(Notification as any).permission = "default"
    const { result } = renderHook(() => usePushSubscription())
    await act(async () => { await result.current.enable() })
    expect(result.current.state).toBe("active")
  })

  it("requestPermission appelé avant tout autre await", async () => {
    const order: string[] = []
    ;(Notification as any).requestPermission = vi.fn(async () => { order.push("permission"); return "granted" })
    ;(navigator.serviceWorker as any).register = vi.fn(async () => { order.push("register"); return { pushManager: { subscribe: vi.fn(async () => ({ endpoint: "x", toJSON: () => ({ keys: { p256dh: "p", auth: "a" } }) })) }, ready: Promise.resolve({}) } })
    const { result } = renderHook(() => usePushSubscription())
    await act(async () => { await result.current.enable() })
    expect(order[0]).toBe("permission")
  })
})
