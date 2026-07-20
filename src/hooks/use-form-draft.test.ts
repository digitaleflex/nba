import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFormDraft } from "./use-form-draft"

const STORAGE_PREFIX = "nba_draft_"
const TEST_KEY = "test-form"
const STORAGE_KEY = `${STORAGE_PREFIX}${TEST_KEY}`

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useFormDraft", () => {
  it("stores data in localStorage with correct prefix after debounce", () => {
    const { rerender } = renderHook(
      ({ data }) => useFormDraft(TEST_KEY, data),
      { initialProps: { data: { name: "John" } } },
    )

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    act(() => { vi.advanceTimersByTime(1000) })

    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify({ name: "John" }))
    rerender({ data: { name: "John" } })
  })

  it("debounces writes and only saves latest value", () => {
    const { rerender } = renderHook(
      ({ data }) => useFormDraft(TEST_KEY, data),
      { initialProps: { data: { field: "a" } } },
    )

    rerender({ data: { field: "b" } })
    act(() => { vi.advanceTimersByTime(1000) })

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).field).toBe("b")
  })

  it("restores saved draft from localStorage", () => {
    const saved = { email: "test@example.com", message: "hello" }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    const { result } = renderHook(() => useFormDraft(TEST_KEY, { email: "", message: "" }))

    const restored = result.current.restore()
    expect(restored).toEqual(saved)
  })

  it("returns null from restore when no draft exists", () => {
    const { result } = renderHook(() => useFormDraft(TEST_KEY, {}))

    expect(result.current.restore()).toBeNull()
  })

  it("clears draft from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }))

    const { result } = renderHook(() => useFormDraft(TEST_KEY, {}))

    act(() => { result.current.clear() })

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.savedAt).toBeNull()
  })

  it("sets savedAt timestamp after saving", () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const { result } = renderHook(() => useFormDraft(TEST_KEY, { x: 1 }))

    expect(result.current.savedAt).toBeNull()

    act(() => { vi.advanceTimersByTime(1000) })

    expect(result.current.savedAt).toBe(now + 1000)
  })

  it("handles corrupt localStorage data gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json")

    const { result } = renderHook(() => useFormDraft(TEST_KEY, {}))

    expect(result.current.restore()).toBeNull()
  })
})
