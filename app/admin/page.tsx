"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Shield, Plus, Search, RefreshCw, Copy, Check, Trash2,
  ChevronDown, ChevronUp, MonitorSmartphone, X, Pencil,
  Calendar, RotateCcw, LogOut, Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { License, LicenseActivation } from "@/lib/license-utils"

const PLAN_LABEL: Record<string, string> = { monthly: "Mensual", lifetime: "De por vida" }
const STATUS_STYLE: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  suspended: "bg-warning/15 text-warning border-warning/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
}
const STATUS_LABEL: Record<string, string> = {
  active: "Activa", suspended: "Suspendida", expired: "Vencida",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return "hace un momento"
  if (mins < 60) return `hace ${mins} min`
  const hs = Math.floor(mins / 60)
  if (hs < 24) return `hace ${hs} h`
  return `hace ${Math.floor(hs / 24)} d`
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState<"monthly" | "lifetime">("monthly")
  const [newEmail, setNewEmail] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editNotes, setEditNotes] = useState("")

  // Stats
  const total = licenses.length
  const active = licenses.filter((l) => l.status === "active").length
  const monthly = licenses.filter((l) => l.plan === "monthly").length
  const lifetime = licenses.filter((l) => l.plan === "lifetime").length

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }
    // Check admin via API (server validates ADMIN_EMAILS env var)
    const res = await fetch("/api/admin/licenses")
    if (res.status === 401) { setAuthorized(false); setLoading(false); return }
    setAuthorized(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchLicenses = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/licenses?q=${encodeURIComponent(search)}`)
    if (res.ok) setLicenses(await res.json())
    setLoading(false)
  }, [search])

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => { if (authorized) fetchLicenses() }, [authorized, fetchLicenses])

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const createLicense = async () => {
    setCreating(true)
    const res = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan, email: newEmail, notes: newNotes }),
    })
    if (res.ok) {
      const created: License = await res.json()
      setLicenses((prev) => [created, ...prev])
      setNewEmail("")
      setNewNotes("")
      copyKey(created.key)
    }
    setCreating(false)
  }

  const updateLicense = async (key: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/licenses/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated: License = await res.json()
      setLicenses((prev) => prev.map((l) => l.key === key ? updated : l))
    }
  }

  const deleteLicense = async (key: string) => {
    if (!confirm(`¿Eliminar la licencia ${key}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/admin/licenses/${key}`, { method: "DELETE" })
    if (res.ok) setLicenses((prev) => prev.filter((l) => l.key !== key))
  }

  const removeDevice = async (licenseKey: string, deviceId: string, hostname: string) => {
    if (!confirm(`¿Desactivar el dispositivo "${hostname}"?`)) return
    await updateLicense(licenseKey, { remove_device_id: deviceId })
  }

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (authorized === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-center">
        <Shield className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">Acceso denegado</h1>
        <p className="text-sm text-muted-foreground">Tu cuenta no tiene permisos de superadministrador.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>Volver al panel</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Tag className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">Superadmin</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Inteliar Labels</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchLicenses} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => {
              await supabase.auth.signOut()
              router.push("/auth/login")
            }}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
              Ir al panel
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: total, color: "text-foreground" },
            { label: "Activas", value: active, color: "text-success" },
            { label: "Mensuales", value: monthly, color: "text-primary" },
            { label: "De por vida", value: lifetime, color: "text-amber-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={cn("text-3xl font-bold mt-1", kpi.color)}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Create new license */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nueva licencia
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Plan</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as "monthly" | "lifetime")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="monthly">Mensual ($10)</option>
                <option value="lifetime">De por vida ($300)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Email del cliente</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Notas</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={createLicense} disabled={creating} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              {creating ? "Generando..." : "Generar clave"}
            </Button>
            <p className="text-xs text-muted-foreground">
              La clave se copia al portapapeles automáticamente.
            </p>
          </div>
        </div>

        {/* Search + list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por clave o email..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : licenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No hay licencias{search ? " que coincidan" : " creadas aún"}.
            </div>
          ) : (
            <div className="space-y-2">
              {licenses.map((license) => (
                <LicenseRow
                  key={license.id}
                  license={license}
                  expanded={expanded === license.id}
                  copied={copied === license.key}
                  editingId={editingId}
                  editEmail={editEmail}
                  editNotes={editNotes}
                  onToggle={() => setExpanded(expanded === license.id ? null : license.id)}
                  onCopy={() => copyKey(license.key)}
                  onStatusChange={(status) => updateLicense(license.key, { status })}
                  onPlanChange={(plan) => updateLicense(license.key, { plan })}
                  onExtend={() => updateLicense(license.key, { extend_days: 30 })}
                  onDelete={() => deleteLicense(license.key)}
                  onRemoveDevice={(deviceId, hostname) => removeDevice(license.key, deviceId, hostname)}
                  onEditStart={() => { setEditingId(license.id); setEditEmail(license.email ?? ""); setEditNotes(license.notes ?? "") }}
                  onEditSave={() => { updateLicense(license.key, { email: editEmail, notes: editNotes }); setEditingId(null) }}
                  onEditCancel={() => setEditingId(null)}
                  onEditEmailChange={setEditEmail}
                  onEditNotesChange={setEditNotes}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface LicenseRowProps {
  license: License
  expanded: boolean
  copied: boolean
  editingId: string | null
  editEmail: string
  editNotes: string
  onToggle: () => void
  onCopy: () => void
  onStatusChange: (s: string) => void
  onPlanChange: (p: string) => void
  onExtend: () => void
  onDelete: () => void
  onRemoveDevice: (id: string, hostname: string) => void
  onEditStart: () => void
  onEditSave: () => void
  onEditCancel: () => void
  onEditEmailChange: (v: string) => void
  onEditNotesChange: (v: string) => void
}

function LicenseRow({
  license, expanded, copied, editingId,
  editEmail, editNotes,
  onToggle, onCopy, onStatusChange, onPlanChange, onExtend,
  onDelete, onRemoveDevice, onEditStart, onEditSave, onEditCancel,
  onEditEmailChange, onEditNotesChange,
}: LicenseRowProps) {
  const activations: LicenseActivation[] = license.activations ?? []
  const isEditing = editingId === license.id

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status badge */}
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0", STATUS_STYLE[license.status])}>
          {STATUS_LABEL[license.status]}
        </span>

        {/* Key */}
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wide hover:text-primary transition-colors shrink-0"
          title="Copiar clave"
        >
          {license.key}
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
        </button>

        {/* Plan */}
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
          license.plan === "lifetime" ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary"
        )}>
          {PLAN_LABEL[license.plan]}
        </span>

        {/* Email */}
        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
          {license.email || <span className="italic">Sin email</span>}
        </span>

        {/* Devices */}
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <MonitorSmartphone className="h-3.5 w-3.5" />
          {activations.length}/{license.max_devices}
        </span>

        {/* Expiry */}
        {license.plan === "monthly" && (
          <span className="text-xs text-muted-foreground shrink-0">
            Vence: {formatDate(license.expires_at)}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEditStart} title="Editar" className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} title="Eliminar" className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onToggle} className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/20">

          {/* Edit fields */}
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => onEditEmailChange(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Notas</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => onEditNotesChange(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button size="sm" onClick={onEditSave}><Check className="h-3.5 w-3.5 mr-1" /> Guardar</Button>
                <Button size="sm" variant="ghost" onClick={onEditCancel}><X className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
              </div>
            </div>
          ) : license.notes ? (
            <p className="text-xs text-muted-foreground italic">{license.notes}</p>
          ) : null}

          {/* Actions row */}
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">Estado</label>
              <select
                value={license.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="active">Activa</option>
                <option value="suspended">Suspendida</option>
                <option value="expired">Vencida</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">Plan</label>
              <select
                value={license.plan}
                onChange={(e) => onPlanChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="monthly">Mensual</option>
                <option value="lifetime">De por vida</option>
              </select>
            </div>
            {license.plan === "monthly" && (
              <div className="flex flex-col justify-end">
                <label className="mb-1 block text-[10px] text-muted-foreground opacity-0">.</label>
                <Button size="sm" variant="outline" onClick={onExtend}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Extender 30 días
                </Button>
              </div>
            )}
            <div className="flex flex-col justify-end">
              <label className="mb-1 block text-[10px] text-muted-foreground opacity-0">.</label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Creada: {formatDate(license.created_at)}
              </div>
            </div>
          </div>

          {/* Devices */}
          <div>
            <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <MonitorSmartphone className="h-3.5 w-3.5" />
              Dispositivos activados ({activations.length}/{license.max_devices})
            </p>
            {activations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin activaciones aún.</p>
            ) : (
              <div className="space-y-1.5">
                {activations.map((a) => (
                  <div key={a.device_id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                    <div>
                      <p className="text-xs font-medium">{a.hostname}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{a.device_id}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Activado: {formatDate(a.activated_at)} · Último: {timeAgo(a.last_seen)}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveDevice(a.device_id, a.hostname)}
                      title="Desactivar dispositivo"
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
