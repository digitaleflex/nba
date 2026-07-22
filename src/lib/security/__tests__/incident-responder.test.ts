import { describe, it, expect } from "vitest"
import { PLAYBOOKS, IncidentResponder } from "../incident-responder"

describe("IncidentResponder", () => {
  it("exports 12 playbooks", () => {
    expect(PLAYBOOKS.length).toBe(12)
  })

  it("all playbooks have required fields", () => {
    for (const pb of PLAYBOOKS) {
      expect(pb.id).toMatch(/^IR-\d{3}$/)
      expect(pb.name).toBeTruthy()
      expect(["P0", "P1", "P2", "P3"]).toContain(pb.severity)
      expect(pb.detectType).toBeTruthy()
      expect(pb.steps.length).toBeGreaterThan(0)
    }
  })

  it("P0 playbooks have revoke or suspend first step", () => {
    const p0 = PLAYBOOKS.filter(p => p.severity === "P0")
    for (const pb of p0) {
      const firstAction = pb.steps[0].action
      expect(["REVOKE_ALL_SESSIONS", "BLOCK_IP", "SUSPEND_ACCOUNT"]).toContain(firstAction)
    }
  })

  it("all step actions are valid PlaybookActions", () => {
    const validActions = [
      "REVOKE_ALL_SESSIONS", "REVOKE_SESSION", "SUSPEND_ACCOUNT",
      "BLOCK_IP", "FORCE_2FA", "NOTIFY_USER", "NOTIFY_ADMIN",
      "LOG_EVENT", "CAPTCHA_CHALLENGE", "CHALLENGE_2FA",
    ]
    for (const pb of PLAYBOOKS) {
      for (const step of pb.steps) {
        expect(validActions).toContain(step.action)
      }
    }
  })

  it("IR-001 (Credential Stuffing) has 5 steps", () => {
    const cs = PLAYBOOKS.find(p => p.id === "IR-001")
    expect(cs).toBeDefined()
    expect(cs!.steps.length).toBe(5)
    expect(cs!.steps[0].action).toBe("BLOCK_IP")
    expect(cs!.steps[4].action).toBe("NOTIFY_ADMIN")
  })

  it("is a singleton", async () => {
    const { incidentResponder } = await import("../incident-responder")
    expect(incidentResponder).toBeInstanceOf(IncidentResponder)
  })
})
