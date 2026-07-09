"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Shield, Plus, Search, RefreshCw, Copy, Check, Trash2,
  ChevronDown, ChevronUp, MonitorSmartphone, X, Pencil,
  Calendar, RotateCcw, LogOut, Tag, FileStack, Printer, Activity,
  Users, CreditCard, Key, Settings, ExternalLink, Info, MessageCircle, Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { License, LicenseActivation } from "@/lib/license-utils"

const PLAN_LABEL: Record<string, string> = { monthly: "Mensual", pro: "Pro", lifetime: "De por vida" }

type AdminTab = "licenses" | "users" | "payments" | "config"
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

interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  whatsapp: string | null
  license: { key: string; plan: string; status: string; expires_at: string | null } | null
}

interface PaymentEvent {
  id: string
  provider: string
  payment_id: string
  email: string | null
  amount: number | null
  currency: string
  plan: string
  license_key: string | null
  license_created: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>("licenses")
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

  interface UserStats {
    templates: number
    labelsMonth: number
    jobsMonth: number
    lastActive: string | null
  }
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})

  interface UserTemplate { name: string; width_mm: number; height_mm: number; created_at: string }
  interface UserJob { name: string; total_labels: number; status: string; printer_name: string | null; created_at: string }
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)
  const [detailData, setDetailData] = useState<{ templates: UserTemplate[]; jobs: UserJob[]; milestones?: { excelDownloaded: string | null; agentDownloaded: string | null } } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  interface PrinterAgg { name: string; jobs: number; users: number }
  const [printerStats, setPrinterStats] = useState<{ models: PrinterAgg[]; brands: PrinterAgg[] } | null>(null)

  const openUserDetail = useCallback(async (u: AdminUser) => {
    setDetailUser(u)
    setDetailData(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/user-detail?userId=${u.id}`)
      if (res.ok) setDetailData(await res.json())
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // Users tab
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Payments tab
  const [payments, setPayments] = useState<PaymentEvent[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  // Stats
  const total = licenses.length
  const active = licenses.filter((l) => l.status === "active").length
  const monthly = licenses.filter((l) => l.plan === "monthly").length
  const lifetime = licenses.filter((l) => l.plan === "lifetime").length
  const mrr = monthly * 10  // $10/mes
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0)

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
    if (res.ok) {
      const data: License[] = await res.json()
      setLicenses(data)
      // Fetch usage stats for all users that have a user_id
      const userIds = [...new Set(data.map((l) => l.user_id).filter(Boolean))]
      if (userIds.length > 0) {
        const statsRes = await fetch("/api/admin/user-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
        })
        if (statsRes.ok) setUserStats(await statsRes.json())
      }
    }
    setLoading(false)
  }, [search])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    const res = await fetch("/api/admin/users")
    if (res.ok) setAdminUsers(await res.json())
    setUsersLoading(false)
  }, [])

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true)
    const res = await fetch("/api/admin/payments")
    if (res.ok) setPayments(await res.json())
    setPaymentsLoading(false)
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => { if (authorized) fetchLicenses() }, [authorized, fetchLicenses])
  useEffect(() => {
    if (authorized && activeTab === "users") {
      fetchUsers()
      fetch("/api/admin/printer-stats").then((r) => r.ok ? r.json() : null).then((d) => d && setPrinterStats(d)).catch(() => {})
    }
    if (authorized && activeTab === "payments") fetchPayments()
  }, [authorized, activeTab, fetchUsers, fetchPayments])

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
            { label: "Licencias activas", value: active, color: "text-success" },
            { label: "Mensuales", value: monthly, color: "text-primary" },
            { label: "De por vida", value: lifetime, color: "text-amber-500" },
            { label: "Usuarios registrados", value: adminUsers.length || total, color: "text-foreground" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={cn("text-3xl font-bold mt-1", kpi.color)}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([
            { id: "licenses", label: "Licencias", icon: Key },
            { id: "users", label: "Usuarios", icon: Users },
            { id: "payments", label: "Pagos", icon: CreditCard },
          ] as { id: AdminTab; label: string; icon: React.ElementType }[])
            .concat([{ id: "config" as AdminTab, label: "Configuración", icon: Settings }])
            .map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── LICENSES TAB ── */}
        {activeTab === "licenses" && <div className="space-y-6">

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
                  stats={license.user_id ? userStats[license.user_id] ?? null : null}
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

        </div>}  {/* end licenses tab */}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="space-y-3">
            {printerStats && (printerStats.brands.length > 0 || printerStats.models.length > 0) && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Printer className="h-4 w-4 text-primary" /> Marcas más usadas
                  </div>
                  <div className="space-y-1.5">
                    {printerStats.brands.slice(0, 6).map((b) => (
                      <div key={b.name} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{b.name}</span>
                        <span className="text-muted-foreground">{b.users} {b.users === 1 ? "usuario" : "usuarios"} · {b.jobs} impr.</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Printer className="h-4 w-4 text-primary" /> Modelos más usados
                  </div>
                  <div className="space-y-1.5">
                    {printerStats.models.slice(0, 6).map((m) => (
                      <div key={m.name} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate pr-2">{m.name}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{m.users} · {m.jobs} impr.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : adminUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Sin usuarios aún.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Registro</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Último acceso</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Actividad</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Trial</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Licencia</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {adminUsers.map((u) => {
                      const daysElapsed = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24))
                      const trialDaysLeft = Math.max(0, 15 - daysElapsed)
                      const trialExpired = trialDaysLeft === 0 && !u.license
                      return (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <button onClick={() => openUserDetail(u)} className="text-foreground hover:text-primary hover:underline text-left">
                            {u.email}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const s = userStats[u.id]
                            if (!s || (s.templates === 0 && s.labelsMonth === 0 && !s.lastActive)) {
                              return <span className="text-[11px] text-muted-foreground italic">Sin actividad</span>
                            }
                            return (
                              <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
                                <span>
                                  <span className="font-medium text-foreground">{s.templates}</span> plantillas
                                  {" · "}
                                  <span className="font-medium text-foreground">{s.labelsMonth.toLocaleString("es-AR")}</span> etiq/mes
                                </span>
                                <span>{s.lastActive ? `últ. impresión ${timeAgo(s.lastActive)}` : "sin impresiones"}</span>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {u.license ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : trialExpired ? (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive border-destructive/30">Vencido</span>
                          ) : (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border-primary/20">{trialDaysLeft}d restantes</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.license ? (
                            <div className="flex items-center gap-2">
                              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_STYLE[u.license.status])}>
                                {STATUS_LABEL[u.license.status]}
                              </span>
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                u.license.plan === "lifetime" ? "bg-amber-500/15 text-amber-600" :
                                u.license.plan === "pro" ? "bg-violet-500/15 text-violet-600" :
                                "bg-primary/10 text-primary"
                              )}>
                                {PLAN_LABEL[u.license.plan] ?? u.license.plan}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sin licencia</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.whatsapp && (
                              <a
                                href={`https://wa.me/${u.whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`WhatsApp: ${u.whatsapp}`}
                                className="text-success hover:text-success/80"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                            <a
                              href={`mailto:${u.email}`}
                              title={`Email: ${u.email}`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                            {!u.license && (
                              <button
                                onClick={async () => {
                                  await fetch("/api/admin/extend-trial", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ userId: u.id, days: 7 }),
                                  })
                                  fetchUsers()
                                }}
                                className="text-xs text-primary hover:underline whitespace-nowrap"
                              >
                                +7 días trial
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {payments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">Total pagos</p>
                  <p className="text-3xl font-bold mt-1 text-foreground">{payments.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">MercadoPago</p>
                  <p className="text-3xl font-bold mt-1 text-primary">{payments.filter(p => p.provider === "mercadopago").length}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">Stripe</p>
                  <p className="text-3xl font-bold mt-1 text-violet-500">{payments.filter(p => p.provider === "stripe").length}</p>
                </div>
              </div>
            )}

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Sin pagos registrados aún. Los pagos aparecen acá cuando llegan los webhooks de MercadoPago o Stripe.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Fecha</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Proveedor</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Monto</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Plan</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Licencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(p.created_at)}</td>
                        <td className="px-4 py-3 text-foreground">{p.email || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            p.provider === "mercadopago" ? "bg-sky-500/15 text-sky-600" : "bg-violet-500/15 text-violet-600"
                          )}>
                            {p.provider === "mercadopago" ? "MercadoPago" : "Stripe"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {p.amount != null ? `${p.currency} ${p.amount.toLocaleString("es-AR")}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            p.plan === "lifetime" ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary"
                          )}>
                            {PLAN_LABEL[p.plan] ?? p.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {p.license_key ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIG TAB ── */}
        {activeTab === "config" && (
          <div className="space-y-6 max-w-2xl">

            {/* Webhook URL info */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Info className="h-4 w-4 text-muted-foreground" />
                URLs de webhooks
              </div>
              <p className="text-xs text-muted-foreground">
                Configurá estas URLs en cada pasarela para que los pagos generen licencias automáticamente.
              </p>
              {[
                { label: "MercadoPago", path: "/api/webhooks/mercadopago" },
                { label: "Stripe", path: "/api/webhooks/stripe" },
              ].map(({ label, path }) => (
                <div key={path}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all">
                      https://etiquetar.app{path}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://etiquetar.app${path}`)}
                      className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* MercadoPago */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
                    <CreditCard className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">MercadoPago</p>
                    <p className="text-xs text-muted-foreground">Pagos en pesos argentinos</p>
                  </div>
                </div>
                <a
                  href="https://www.mercadopago.com.ar/developers/panel/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Panel MP <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-3 text-sm">
                <Step n={1} text="Entrá al Panel de Desarrolladores de MercadoPago" />
                <Step n={2} text='Creá una aplicación → copiá el "Access Token" de producción' />
                <Step n={3}>
                  Agregalo en Vercel como variable de entorno:
                  <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">MERCADOPAGO_ACCESS_TOKEN=APP_USR-...</code>
                </Step>
                <Step n={4} text='En tu aplicación MP → "Notificaciones IPN" → pegá la URL del webhook de arriba' />
                <Step n={5} text='Seleccioná el evento "Pagos" y guardá' />
              </div>
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> en la descripción o referencia externa del pago incluí "vida" o "lifetime" para que se asigne plan vitalicio. De lo contrario se asigna plan mensual.
              </div>
            </div>

            {/* Stripe */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                    <CreditCard className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Stripe</p>
                    <p className="text-xs text-muted-foreground">Pagos internacionales en USD</p>
                  </div>
                </div>
                <a
                  href="https://dashboard.stripe.com/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Dashboard Stripe <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-3 text-sm">
                <Step n={1} text="En el Dashboard de Stripe → Developers → Webhooks" />
                <Step n={2} text='Clic en "Add endpoint" → pegá la URL del webhook de arriba' />
                <Step n={3} text='Seleccioná el evento "checkout.session.completed"' />
                <Step n={4}>
                  Copiá el "Signing secret" y agregalo en Vercel:
                  <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">STRIPE_WEBHOOK_SECRET=whsec_...</code>
                </Step>
                <Step n={5}>
                  En tu Checkout, pasá el plan en metadata:
                  <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{"metadata: { plan: 'lifetime' }"}</code>
                </Step>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> si <code>metadata.plan</code> no está definido, el sistema infiere el plan por el nombre del producto. Incluí "lifetime" o "vida" en el nombre para plan vitalicio.
              </div>
            </div>

            {/* Resend */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Settings className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Resend (email de licencia)</p>
                    <p className="text-xs text-muted-foreground">Envía la clave al cliente automáticamente</p>
                  </div>
                </div>
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Resend API Keys <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-3 text-sm">
                <Step n={1} text="Creá una cuenta en resend.com y verificá tu dominio" />
                <Step n={2}>
                  Generá una API key y agregala en Vercel:
                  <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">RESEND_API_KEY=re_...</code>
                </Step>
                <Step n={3} text="Listo — al llegar un pago aprobado, la clave se envía automáticamente al email del cliente" />
              </div>
            </div>

            {/* Vercel env vars summary */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Variables de entorno en Vercel</p>
              <div className="space-y-1.5">
                {[
                  "MERCADOPAGO_ACCESS_TOKEN",
                  "STRIPE_WEBHOOK_SECRET",
                  "RESEND_API_KEY",
                  "NEXT_PUBLIC_CHECKOUT_MONTHLY_URL",
                  "NEXT_PUBLIC_CHECKOUT_LIFETIME_URL",
                  "ADMIN_EMAILS",
                ].map((v) => (
                  <div key={v} className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-foreground">{v}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(v)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ir a Vercel Environment Variables <ExternalLink className="h-3 w-3" />
              </a>
            </div>

          </div>
        )}

      </div>

      {/* User detail modal: what a user builds and prints (demand insight) */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDetailUser(null)}>
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{detailUser.email}</h3>
                <p className="text-[11px] text-muted-foreground">Registrado {formatDate(detailUser.created_at)}</p>
              </div>
              <button onClick={() => setDetailUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading || !detailData ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {/* Printers used */}
                {(() => {
                  const printers = Array.from(new Set(
                    detailData.jobs.map((j) => j.printer_name).filter((p): p is string => !!p)
                  ))
                  return (
                    <div className="flex items-start gap-2 rounded-lg border border-border px-3 py-2.5">
                      <Printer className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-foreground mb-1">Impresoras usadas</div>
                        {printers.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground italic">Ninguna (aún no imprimió a una impresora real / solo ZPL)</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {printers.map((p) => (
                              <span key={p} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{p}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Milestones */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["Descargó Excel", detailData.milestones?.excelDownloaded ?? null],
                    ["Descargó agente", detailData.milestones?.agentDownloaded ?? null],
                    ["Creó plantilla", detailData.templates.length > 0 ? detailData.templates[detailData.templates.length - 1].created_at : null],
                    ["Imprimió", detailData.jobs.length > 0 ? detailData.jobs[detailData.jobs.length - 1].created_at : null],
                  ] as [string, string | null][]).map(([label, date]) => (
                    <div key={label} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs", date ? "border-success/30 bg-success/10" : "border-border")}>
                      {date ? <Check className="h-4 w-4 text-success flex-shrink-0" /> : <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className={cn("font-medium", date ? "text-foreground" : "text-muted-foreground")}>{label}</div>
                        {date && <div className="text-[10px] text-muted-foreground">{timeAgo(date)}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Templates */}
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                    <FileStack className="h-4 w-4 text-primary" /> Plantillas ({detailData.templates.length})
                  </div>
                  {detailData.templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No creó plantillas todavía.</p>
                  ) : (
                    <div className="space-y-1">
                      {detailData.templates.map((t, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                          <span className="font-medium text-foreground">{t.name || "Sin nombre"}</span>
                          <span className="text-muted-foreground">{t.width_mm}×{t.height_mm}mm · {formatDate(t.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Print jobs */}
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Printer className="h-4 w-4 text-primary" /> Impresiones ({detailData.jobs.length})
                  </div>
                  {detailData.jobs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No imprimió nada todavía.</p>
                  ) : (
                    <div className="space-y-1">
                      {detailData.jobs.map((j, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <span className="font-medium text-foreground">{j.name || "Trabajo"}</span>
                            <span className="text-muted-foreground"> · {j.printer_name || "sin impresora (ZPL)"}</span>
                          </div>
                          <span className="whitespace-nowrap text-muted-foreground">
                            <span className="font-medium text-foreground">{j.total_labels}</span> etiq · {timeAgo(j.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Step({ n, text, children }: { n: number; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span className="text-sm text-muted-foreground leading-snug">
        {text ?? children}
      </span>
    </div>
  )
}

interface UserStats {
  templates: number
  labelsMonth: number
  jobsMonth: number
  lastActive: string | null
}

interface LicenseRowProps {
  license: License
  stats: UserStats | null
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
  license, stats, expanded, copied, editingId,
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

        {/* Usage stats */}
        {stats && (
          <span className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1" title="Plantillas">
              <FileStack className="h-3.5 w-3.5" />
              {stats.templates}
            </span>
            <span className="flex items-center gap-1" title="Etiquetas este mes">
              <Printer className="h-3.5 w-3.5" />
              {stats.labelsMonth.toLocaleString("es-AR")}
            </span>
          </span>
        )}

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

          {/* Usage stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Plantillas", value: stats.templates, icon: FileStack },
                { label: "Etiquetas este mes", value: stats.labelsMonth.toLocaleString("es-AR"), icon: Printer },
                { label: "Trabajos este mes", value: stats.jobsMonth, icon: Activity },
                { label: "Último trabajo", value: stats.lastActive ? timeAgo(stats.lastActive) : "—", icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                  <p className="text-lg font-bold text-foreground leading-none">{value}</p>
                </div>
              ))}
            </div>
          )}

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
