import type { SupabaseClient } from "@supabase/supabase-js"

// Best-effort audit trail for admin mutations. Never throws — a logging
// failure should never block the actual admin action.
export async function logAdminAction(
  supabaseAdmin: SupabaseClient,
  adminEmail: string,
  action: string,
  target?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_email: adminEmail,
      action,
      target: target ?? null,
      details: details ?? null,
    })
  } catch (err) {
    console.error("[admin-audit-log] failed to record action:", err)
  }
}
