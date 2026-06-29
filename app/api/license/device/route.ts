import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// DELETE /api/license/device
// Body: { device_id }
// Removes a device activation from the user's license.
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { device_id } = await req.json()
    if (!device_id) return NextResponse.json({ error: "device_id requerido" }, { status: 400 })

    const { data: license, error } = await supabaseAdmin
      .from("licenses")
      .select("id, activations")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !license) {
      return NextResponse.json({ error: "Licencia no encontrada" }, { status: 404 })
    }

    const activations = (license.activations ?? []).filter(
      (a: { device_id: string }) => a.device_id !== device_id
    )

    await supabaseAdmin
      .from("licenses")
      .update({ activations })
      .eq("id", license.id)

    return NextResponse.json({ ok: true, devices_remaining: activations.length })
  } catch (err) {
    console.error("[license/device DELETE]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
