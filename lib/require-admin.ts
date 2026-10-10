import { createClient } from "@/lib/supabase/server"

export function isAdminEmail(email?: string | null): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes((email ?? "").toLowerCase())
}

/** Returns the logged-in user if they are an admin (ADMIN_EMAILS), else null. */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}
