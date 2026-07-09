import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 3600 // revalidate every hour

// This endpoint is intentionally public — it feeds the "trusted by N
// companies" counter on the landing page, which needs to render for
// logged-out visitors. To avoid leaking exact business metrics that a
// competitor could poll over time to track growth, round down to a coarse
// step before returning: the landing page only ever shows "k/M" formatted
// values anyway, so this loses no real marketing value.
function roundDown(n: number): number {
  if (n < 20) return Math.floor(n / 5) * 5
  if (n < 200) return Math.floor(n / 10) * 10
  if (n < 2000) return Math.floor(n / 50) * 50
  if (n < 20000) return Math.floor(n / 500) * 500
  return Math.floor(n / 5000) * 5000
}

export async function GET() {
  try {
    const [usersRes, labelsRes, templatesRes] = await Promise.all([
      supabase.auth.admin.listUsers({ perPage: 1 }),
      supabase.from("print_jobs").select("total_labels").eq("status", "completed"),
      supabase.from("templates").select("id", { count: "exact", head: true }),
    ])

    const totalUsers = usersRes.data?.users?.length ?? 0
    const totalLabels = (labelsRes.data ?? []).reduce(
      (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
      0
    )
    const totalTemplates = templatesRes.count ?? 0

    return NextResponse.json({
      empresas: roundDown(totalUsers),
      etiquetas: roundDown(totalLabels),
      plantillas: roundDown(totalTemplates),
    })
  } catch (e: any) {
    return NextResponse.json({ empresas: 0, etiquetas: 0, plantillas: 0 })
  }
}
