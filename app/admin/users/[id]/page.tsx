"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { renderLabelToPng } from "@/lib/label-image"
import type { CanvasData } from "@/lib/label-types"

interface Template {
  id: string
  name: string
  width_mm: number
  height_mm: number
  variables: string[] | null
  canvas_data: CanvasData
  created_at: string
}
interface Job {
  id: string
  name: string
  total_labels: number
  printed_labels: number
  status: string
  printer_name: string | null
  error_message: string | null
  source_file: string | null
  template_id: string | null
  created_at: string
  firstRow: Record<string, string> | null
}
interface View {
  user: { id: string; email: string; created_at: string; last_sign_in_at: string | null; name: string | null; whatsapp: string | null; trialExtraDays: number }
  licenses: { key: string; plan: string; status: string; expires_at: string | null; max_devices: number; activations: { device_id: string; hostname: string; last_seen: string }[] }[]
  printers: { printer_name: string; connection: string; status: string; last_seen: string }[]
  templates: Template[]
  jobs: Job[]
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—")

// Renders the label as the printer would, with the data given (or the raw
// {{variables}} when there is none), so support sees the design as built.
function LabelThumb({ template, row }: { template: Template; row: Record<string, string> }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    renderLabelToPng(template, row).then((u) => alive && setSrc(u)).catch(() => alive && setSrc(null))
    return () => { alive = false }
  }, [template, row])
  if (!src) return <div className="flex h-24 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">Sin vista previa</div>
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={template.name} className="max-h-40 rounded border bg-white" />
}

export default function AdminUserViewPage() {
  const { id } = useParams<{ id: string }>()
  const [view, setView] = useState<View | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openJob, setOpenJob] = useState<string | null>(null)
  const [impersonating, setImpersonating] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/user-view?userId=${id}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? "Error")
        setView(j)
      })
      .catch((e) => setError(e.message))
  }, [id])

  async function impersonate() {
    setImpersonating(true)
    try {
      const r = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? "Error")
      setLink(j.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setImpersonating(false)
    }
  }

  if (error && !view) return <div className="p-8 text-sm text-red-600">{error}</div>
  if (!view) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>

  const { user, licenses, printers, templates, jobs } = view
  const templateById = Object.fromEntries(templates.map((t) => [t.id, t]))

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/admin" className="text-sm text-blue-600 hover:underline">← Volver al panel</Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border p-5">
        <div>
          <h1 className="text-lg font-semibold">{user.name || user.email}</h1>
          <p className="text-sm text-muted-foreground">
            {user.name ? `${user.email} · ` : ""}Registrado {fmt(user.created_at)} · Último ingreso {fmt(user.last_sign_in_at)}
            {user.whatsapp ? ` · ${user.whatsapp}` : ""}
            {user.trialExtraDays ? ` · +${user.trialExtraDays} días de prueba` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Vista de solo lectura. Cada consulta queda registrada.</p>
        </div>
        <div className="text-right">
          <button
            onClick={impersonate}
            disabled={impersonating}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {impersonating ? "Generando…" : "Entrar como este usuario"}
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>

      {link && (
        <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-medium text-red-900">Abrí este link en una ventana de incógnito (así no perdés tu sesión de admin):</p>
          <p className="text-xs text-red-800">Sirve una sola vez y queda registrado. Vas a ver un cartel rojo mientras estés dentro de su cuenta.</p>
          <div className="flex gap-2">
            <input readOnly value={link} className="flex-1 rounded border bg-white px-2 py-1 font-mono text-xs" onFocus={(e) => e.target.select()} />
            <button
              onClick={() => navigator.clipboard.writeText(link)}
              className="rounded border bg-white px-3 py-1 text-xs hover:bg-muted"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      <section className="rounded-xl border p-5">
        <h2 className="mb-3 text-sm font-semibold">Licencia y agente</h2>
        {licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin licencia (todavía no abrió Configuración → Licencia ni pagó).</p>
        ) : licenses.map((l) => (
          <div key={l.key} className="mb-3 text-sm">
            <p><code className="rounded bg-muted px-1.5 py-0.5">{l.key}</code> · plan <strong>{l.plan}</strong> · {l.status}{l.expires_at ? ` · vence ${fmt(l.expires_at)}` : ""}</p>
            <p className="text-xs text-muted-foreground">
              Computadoras activadas: {l.activations.length}/{l.max_devices}
              {l.activations.map((a) => ` · ${a.hostname} (visto ${fmt(a.last_seen)})`).join("")}
            </p>
          </div>
        ))}
        {printers.length > 0 && (
          <ul className="mt-2 text-sm">
            {printers.map((p, i) => (
              <li key={i}>🖨️ {p.printer_name} · {p.connection} · {p.status} · visto {fmt(p.last_seen)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="mb-3 text-sm font-semibold">Plantillas ({templates.length})</h2>
        {templates.length === 0 ? <p className="text-sm text-muted-foreground">No creó plantillas.</p> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((t) => (
              <div key={t.id} className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-medium">{t.name} <span className="text-xs text-muted-foreground">· {t.width_mm}×{t.height_mm} mm · {fmt(t.created_at)}</span></p>
                <LabelThumb template={t} row={{}} />
                <p className="text-xs text-muted-foreground">Variables: {(t.variables ?? []).map((v) => `{{${v}}}`).join(", ") || "ninguna"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="mb-3 text-sm font-semibold">Últimos trabajos ({jobs.length})</h2>
        {jobs.length === 0 ? <p className="text-sm text-muted-foreground">No creó trabajos.</p> : (
          <ul className="divide-y">
            {jobs.map((j) => {
              const t = j.template_id ? templateById[j.template_id] : undefined
              return (
                <li key={j.id} className="py-2 text-sm">
                  <button onClick={() => setOpenJob(openJob === j.id ? null : j.id)} className="flex w-full items-center justify-between gap-3 text-left">
                    <span className="font-medium">{j.name}</span>
                    <span className="text-xs text-muted-foreground">{j.total_labels} etiq. · {j.status} · {fmt(j.created_at)}</span>
                  </button>
                  {openJob === j.id && (
                    <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        Archivo: {j.source_file ?? "—"} · Impresora: {j.printer_name ?? "—"} · Impresas: {j.printed_labels}/{j.total_labels}
                      </p>
                      {j.error_message && <p className="text-xs text-red-600">Error: {j.error_message}</p>}
                      {t && j.firstRow && <LabelThumb template={t} row={j.firstRow} />}
                      {j.firstRow && (
                        <pre className="overflow-x-auto rounded bg-background p-2 text-[11px]">{JSON.stringify(j.firstRow, null, 2)}</pre>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
