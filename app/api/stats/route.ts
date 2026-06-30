import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 3600 // revalidate every hour

export async function GET() {
  try {
    const [usersRes, labelsRes, templatesRes] = await Promise.all([
      supabase.auth.admin.listUsers({ perPage: 1 }),
      supabase.from("print_jobs").select("total_labels").eq("status", "completed"),
      supabase.from("templates").select("id", { count: "exact", head: true }),
    ])

    const totalUsers = usersRes.data?.total ?? 0
    const totalLabels = (labelsRes.data ?? []).reduce(
      (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
      0
    )
    const totalTemplates = templatesRes.count ?? 0

    return NextResponse.json({
      empresas: totalUsers,
      etiquetas: totalLabels,
      plantillas: totalTemplates,
    })
  } catch (e: any) {
    return NextResponse.json({ empresas: 0, etiquetas: 0, plantillas: 0 })
  }
}
