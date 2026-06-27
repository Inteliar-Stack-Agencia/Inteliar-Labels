// License key generation and validation utilities

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I,O,0,1 (confusables)

export function generateLicenseKey(): string {
  const segment = (len: number) =>
    Array.from({ length: len }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join("")
  return `INTELIAR-${segment(4)}-${segment(4)}-${segment(4)}`
}

export function isValidKeyFormat(key: string): boolean {
  return /^INTELIAR-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(key.toUpperCase().trim())
}

export function maxDevicesForPlan(plan: string): number {
  return plan === "lifetime" ? 3 : 1
}

export interface LicenseActivation {
  device_id: string
  hostname: string
  activated_at: string
  last_seen: string
}

export interface License {
  id: string
  key: string
  user_id: string | null
  plan: "monthly" | "lifetime"
  status: "active" | "suspended" | "expired"
  email: string | null
  notes: string | null
  max_devices: number
  activations: LicenseActivation[]
  expires_at: string | null
  created_at: string
  updated_at: string
}
