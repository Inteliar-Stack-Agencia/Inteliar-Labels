import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/print/relay/:id — poll the status of a cloud print job.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: job } = await supabaseAdmin
    .from("print_jobs")
    .select("id, status, error, license_key, completed_at")
    .eq("id", id)
    .maybeSingle()

  if (!job) return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 })

  // Ensure the job belongs to a license owned by this user
  const { data: owns } = await supabaseAdmin
    .from("licenses")
    .select("key")
    .eq("user_id", user.id)
    .eq("key", job.license_key)
    .maybeSingle()
  if (!owns) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })

  return NextResponse.json({
    id: job.id,
    status: job.status,
    error: job.error,
    completedAt: job.completed_at,
  })
}
