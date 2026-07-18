import { describe, it, expect } from "vitest"
import { generateLicenseKey, isValidKeyFormat, maxDevicesForPlan } from "./license-utils"

describe("generateLicenseKey", () => {
  it("matches the INTELIAR-XXXX-XXXX-XXXX format", () => {
    const key = generateLicenseKey()
    expect(key).toMatch(/^INTELIAR-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  })

  it("excludes confusable characters (I, O, 0, 1) from the generated segments", () => {
    for (let i = 0; i < 200; i++) {
      const key = generateLicenseKey()
      const segments = key.replace(/^INTELIAR-/, "")
      expect(segments).not.toMatch(/[IO01]/)
    }
  })

  it("generates unique keys across many calls", () => {
    const keys = new Set(Array.from({ length: 500 }, () => generateLicenseKey()))
    expect(keys.size).toBe(500)
  })
})

describe("isValidKeyFormat", () => {
  it("accepts a well-formed key", () => {
    expect(isValidKeyFormat("INTELIAR-AB23-CD45-EF67")).toBe(true)
  })

  it("is case-insensitive and trims whitespace", () => {
    expect(isValidKeyFormat("  inteliar-ab23-cd45-ef67  ")).toBe(true)
  })

  it("rejects confusable characters I, O, 0, 1", () => {
    expect(isValidKeyFormat("INTELIAR-I023-CD45-EF67")).toBe(false)
  })

  it("rejects wrong segment lengths", () => {
    expect(isValidKeyFormat("INTELIAR-AB2-CD45-EF67")).toBe(false)
    expect(isValidKeyFormat("INTELIAR-AB234-CD45-EF67")).toBe(false)
  })

  it("rejects a completely different string", () => {
    expect(isValidKeyFormat("not-a-license-key")).toBe(false)
    expect(isValidKeyFormat("")).toBe(false)
  })

  it("rejects a key missing the INTELIAR prefix", () => {
    expect(isValidKeyFormat("AB23-CD45-EF67")).toBe(false)
  })
})

describe("maxDevicesForPlan", () => {
  it("lifetime plan allows 5 devices", () => {
    expect(maxDevicesForPlan("lifetime")).toBe(5)
  })

  it("pro plan allows 3 devices", () => {
    expect(maxDevicesForPlan("pro")).toBe(3)
  })

  it("monthly plan allows 1 device", () => {
    expect(maxDevicesForPlan("monthly")).toBe(1)
  })

  it("unknown plan defaults to 1 device (fails closed, not open)", () => {
    expect(maxDevicesForPlan("unknown")).toBe(1)
    expect(maxDevicesForPlan("")).toBe(1)
  })
})
