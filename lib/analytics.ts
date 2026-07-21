import { track } from "@vercel/analytics"
import { gtagEvent, gtagAdsConversion, GOOGLE_ADS_REGISTER_CONVERSION } from "@/components/google-analytics"
import { fbqEvent } from "@/components/meta-pixel"

function event(name: string, params?: Record<string, any>) {
  track(name, params)
  gtagEvent(name, params)
}

// Persist an engagement milestone for the logged-in user (fire-and-forget).
// Anonymous callers are silently ignored server-side.
function persist(name: string, metadata?: Record<string, any>) {
  if (typeof window === "undefined") return
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: name, metadata }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}

// Conversion funnel events
export const analytics = {
  // ── Landing ──────────────────────────────────────────────────────────────
  ctaClick: (location: "hero" | "navbar" | "pricing" | "final-cta" | "calculator" | "ai_template") =>
    event("cta_click", { location }),

  pricingClick: (plan: "monthly" | "pro" | "pro1y" | "pro3y" | "pro5y") =>
    event("pricing_click", { plan }),

  // ── Auth (embudo paso 1 y 2) ──────────────────────────────────────────────
  registerStart: () => event("register_start"),

  registerComplete: (email: string) => {
    event("sign_up", { method: "email" })           // nombre estándar GA4
    event("register_complete", { email })
    gtagAdsConversion(GOOGLE_ADS_REGISTER_CONVERSION)  // conversión "Registro" en Google Ads
    fbqEvent("CompleteRegistration")                   // conversión estándar en Meta Ads
  },

  // ── Onboarding (embudo paso 3) ────────────────────────────────────────────
  agentDownloaded: () => { event("agent_downloaded"); persist("agent_downloaded") },  // clic en descargar .exe

  excelDownloaded: () => { event("excel_downloaded"); persist("excel_downloaded") },  // clic en descargar plantilla Excel

  // ── Core actions (embudo paso 4 y 5) ─────────────────────────────────────
  templateCreated: () => event("template_created"),

  firstPrint: () => event("first_print"),            // primera impresión exitosa

  printJobStarted: (labelCount: number) =>
    event("print_job_started", { label_count: labelCount }),

  printJobCompleted: (labelCount: number) =>
    event("print_job_completed", { label_count: labelCount }),

  // ── License / pago (embudo paso 6) ───────────────────────────────────────
  licenseActivated: (plan: string) => {
    const value = plan === "monthly" ? 10 : plan === "pro" ? 19 : 300
    event("purchase", {                              // nombre estándar GA4 / Google Ads
      transaction_id: `license_${Date.now()}`,
      value,
      currency: "USD",
      items: [{ item_name: `plan_${plan}`, quantity: 1 }],
    })
    fbqEvent("Purchase", { value, currency: "USD" })  // conversión estándar en Meta Ads
    event("license_activated", { plan })
  },

  trialStarted: () => event("trial_started"),

  // ── Integraciones ─────────────────────────────────────────────────────────
  tiendanubeConnected: (total: number) =>
    event("tiendanube_connected", { product_count: total }),

  tiendanubeSynced: (total: number) =>
    event("tiendanube_synced", { product_count: total }),

  // ── Upgrade intent ────────────────────────────────────────────────────────
  upgradeCtaClick: (from: string, to: string) =>
    event("upgrade_cta_click", { from, to }),

  deviceDeactivated: () => event("device_deactivated"),
}
