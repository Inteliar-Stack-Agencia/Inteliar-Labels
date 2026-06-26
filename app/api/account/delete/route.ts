// POST /api/account/delete — delete the authenticated user's account.
//
// Removes all data owned by the user (printers, templates, print jobs) and,
// if a service-role key is configured, deletes the Supabase Auth user too.
// Without the service-role key we can only purge the data and sign the user
// out — the auth record must then be removed manually from the dashboard.

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = user.id

  // 1. Purge user-owned rows. print_job_rows are removed via their parent jobs
  //    (FK cascade); we also clear them explicitly in case cascade isn't set.
  try {
    const { data: jobs } = await supabase
      .from("print_jobs")
      .select("id")
      .eq("user_id", userId)

    const jobIds = (jobs ?? []).map((j: { id: string }) => j.id)
    if (jobIds.length > 0) {
      await supabase.from("print_job_rows").delete().in("job_id", jobIds)
    }

    await supabase.from("print_jobs").delete().eq("user_id", userId)
    await supabase.from("templates").delete().eq("user_id", userId)
    await supabase.from("printers").delete().eq("user_id", userId)
  } catch (err) {
    return NextResponse.json(
      { error: `No se pudieron borrar los datos: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    )
  }

  // 2. Delete the auth user if we have admin credentials.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  let authUserDeleted = false
  if (serviceKey && supabaseUrl) {
    try {
      const admin = createAdminClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (!error) authUserDeleted = true
    } catch {
      // fall through — data is already gone, user can be removed manually
    }
  }

  // 3. End the session regardless.
  await supabase.auth.signOut()

  return NextResponse.json({
    success: true,
    authUserDeleted,
    message: authUserDeleted
      ? "Cuenta eliminada por completo."
      : "Datos eliminados y sesión cerrada. El usuario de autenticación debe borrarse manualmente desde Supabase.",
  })
}
