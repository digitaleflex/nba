import type { CoachMessage } from "./providers/types"

type Listener = (message: CoachMessage) => void

const listeners = new Set<Listener>()

export function onCoachMessage(cb: Listener) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function emitCoachMessage(msg: CoachMessage) {
  for (const cb of listeners) cb(msg)
}
