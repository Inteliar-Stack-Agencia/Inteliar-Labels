import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isValidKeyFormat, maxDevicesForPlan } from "@/lib/license-utils"
import type { LicenseActivation } from "@/lib/license-utils"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/license/validate
// Called by the printer agent on every startup to validate its license key.
// Body: { key, device_id, hostname }
// Returns: { valid, plan, status, message, devices_used, max_devices }
export async function POST(req: NextRequest) {
  try {
    const { key, device_id, hostname } = await req.json()

    if (!key || !isValidKeyFormat(key)) {
      return NextResponse.json({ valid: false, message: "Clave inválida" }, { status: 400 })
    }

    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("key", key.toUpperCase().trim())
      .single()

    if (error || !license) {
      return NextResponse.json({ valid: false, message: "Clave no encontrada" }, { status: 404 })
    }

    if (license.status === "suspended") {
      return NextResponse.json({ valid: false, message: "Licencia suspendida. Contactá soporte." }, { status: 403 })
    }

    if (license.expires_at) {
      const expiredAt = new Date(license.expires_at)
      const graceDeadline = new Date(expiredAt.getTime() + 2 * 24 * 60 * 60 * 1000)
      const now = new Date()
      if (now > graceDeadline) {
        if (license.status !== "expired") {
          await supabase.from("licenses").update({ status: "expired" }).eq("id", license.id)
        }
        return NextResponse.json({ valid: false, message: "Licencia vencida. Renová tu suscripción." }, { status: 403 })
      }
      if (now > expiredAt) {
        // Within grace period — still valid but warn
        return NextResponse.json({
          valid: true,
          plan: license.plan,
          status: "grace",
          message: `Licencia vencida — período de gracia activo (${Math.ceil((graceDeadline.getTime() - now.getTime()) / 86400000)}d restante). Renová para no perder acceso.`,
          devices_used: (license.activations ?? []).length,
          max_devices: license.max_devices,
        })
      }
    }
    if (license.status === "expired") {
      return NextResponse.json({ valid: false, message: "Licencia vencida. Renová tu suscripción." }, { status: 403 })
    }

    const activations: LicenseActivation[] = license.activations ?? []
    const now = new Date().toISOString()
    const existing = activations.find((a) => a.device_id === device_id)

    if (existing) {
      // Known device — update last_seen
      const updated = activations.map((a) =>
        a.device_id === device_id ? { ...a, last_seen: now } : a
      )
      await supabase.from("licenses").update({ activations: updated }).eq("id", license.id)
    } else {
      // New device — check limit
      if (activations.length >= license.max_devices) {
        return NextResponse.json({
          valid: false,
          message: `Límite de ${license.max_devices} dispositivo(s) alcanzado. Desactivá uno desde el panel.`,
          devices_used: activations.length,
          max_devices: license.max_devices,
        }, { status: 403 })
      }
      const newActivation: LicenseActivation = {
        device_id,
        hostname: hostname || "Desconocido",
        activated_at: now,
        last_seen: now,
      }
      await supabase.from("licenses").update({
        activations: [...activations, newActivation],
      }).eq("id", license.id)
    }

    return NextResponse.json({
      valid: true,
      plan: license.plan,
      status: license.status,
      message: "Licencia válida",
      devices_used: existing ? activations.length : activations.length + 1,
      max_devices: license.max_devices,
    })
  } catch (err) {
    console.error("[license/validate]", err)
    return NextResponse.json({ valid: false, message: "Error interno" }, { status: 500 })
  }
}
