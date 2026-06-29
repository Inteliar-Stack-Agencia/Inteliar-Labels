import { track } from "@vercel/analytics"

// Conversion funnel events
export const analytics = {
  // Landing
  ctaClick: (location: "hero" | "navbar" | "pricing" | "final-cta") =>
    track("cta_click", { location }),

  pricingClick: (plan: "monthly" | "pro" | "lifetime") =>
    track("pricing_click", { plan }),

  // Auth
  registerStart: () => track("register_start"),
  registerComplete: (email: string) => track("register_complete", { email }),

  // Core actions
  templateCreated: () => track("template_created"),
  printJobStarted: (labelCount: number) => track("print_job_started", { label_count: labelCount }),
  printJobCompleted: (labelCount: number) => track("print_job_completed", { label_count: labelCount }),

  // License
  licenseActivated: (plan: string) => track("license_activated", { plan }),
  deviceDeactivated: () => track("device_deactivated"),

  // Upgrade intent
  upgradeCtaClick: (from: string, to: string) => track("upgrade_cta_click", { from, to }),
}
