import { describe, it, expect } from "vitest"
import crypto from "crypto"
import { inferPlan, inferPlanAndTerm, verifyMercadopagoSignature } from "./route"

describe("inferPlan", () => {
  it("detects lifetime from 'de por vida'", () => {
    expect(inferPlan("Plan de por vida")).toBe("lifetime")
  })

  it("detects lifetime from 'lifetime'", () => {
    expect(inferPlan("Inteliar Lifetime Plan")).toBe("lifetime")
  })

  it("detects pro", () => {
    expect(inferPlan("Suscripción Pro mensual")).toBe("pro")
  })

  it("defaults to monthly when nothing matches", () => {
    expect(inferPlan("Suscripción Inteliar Labels")).toBe("monthly")
    expect(inferPlan("")).toBe("monthly")
  })

  it("lifetime takes priority over pro if both appear", () => {
    expect(inferPlan("Plan Pro de por vida")).toBe("lifetime")
  })
})

describe("inferPlanAndTerm", () => {
  it("parses prepaid multi-year external_reference (pro:36)", () => {
    expect(inferPlanAndTerm("pro:36", "cualquier cosa")).toEqual({ plan: "pro", months: 36 })
  })

  it("falls back to text inference when external_reference doesn't match", () => {
    expect(inferPlanAndTerm("", "Plan de por vida")).toEqual({ plan: "lifetime", months: 1 })
  })

  it("falls back to monthly/1 for an unrecognized reference and descriptor", () => {
    expect(inferPlanAndTerm("order-123", "Compra genérica")).toEqual({ plan: "monthly", months: 1 })
  })

  it("ignores malformed pro: reference (non-numeric)", () => {
    expect(inferPlanAndTerm("pro:abc", "Suscripción Pro")).toEqual({ plan: "pro", months: 1 })
  })
})

describe("verifyMercadopagoSignature", () => {
  const secret = "test-secret"
  const dataId = "123456789"
  const requestId = "req-abc-123"
  const ts = "1700000000"

  function sign(manifest: string) {
    return crypto.createHmac("sha256", secret).update(manifest).digest("hex")
  }

  it("accepts a correctly signed payload", () => {
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
    const v1 = sign(manifest)
    const xSignature = `ts=${ts},v1=${v1}`
    expect(verifyMercadopagoSignature(xSignature, requestId, dataId, secret)).toBe(true)
  })

  it("rejects a tampered signature", () => {
    const xSignature = `ts=${ts},v1=deadbeef`
    expect(verifyMercadopagoSignature(xSignature, requestId, dataId, secret)).toBe(false)
  })

  it("rejects when signed with the wrong secret", () => {
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
    const wrongSig = crypto.createHmac("sha256", "wrong-secret").update(manifest).digest("hex")
    const xSignature = `ts=${ts},v1=${wrongSig}`
    expect(verifyMercadopagoSignature(xSignature, requestId, dataId, secret)).toBe(false)
  })

  it("rejects when data.id doesn't match what was signed", () => {
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
    const v1 = sign(manifest)
    const xSignature = `ts=${ts},v1=${v1}`
    expect(verifyMercadopagoSignature(xSignature, requestId, "different-id", secret)).toBe(false)
  })

  it("rejects missing x-signature header", () => {
    expect(verifyMercadopagoSignature("", requestId, dataId, secret)).toBe(false)
  })

  it("rejects missing x-request-id header", () => {
    const manifest = `id:${dataId.toLowerCase()};request-id:;ts:${ts};`
    const v1 = sign(manifest)
    expect(verifyMercadopagoSignature(`ts=${ts},v1=${v1}`, "", dataId, secret)).toBe(false)
  })

  it("rejects missing dataId", () => {
    expect(verifyMercadopagoSignature(`ts=${ts},v1=abc`, requestId, "", secret)).toBe(false)
  })

  it("rejects a malformed x-signature header (no v1)", () => {
    expect(verifyMercadopagoSignature(`ts=${ts}`, requestId, dataId, secret)).toBe(false)
  })
})
