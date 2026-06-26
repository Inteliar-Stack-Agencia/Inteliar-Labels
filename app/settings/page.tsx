"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Printer,
  User,
  Wifi,
  Usb,
  Cable,
  FlaskConical,
  Plus,
  Trash2,
  Star,
  Play,
  Search,
  RefreshCw,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { PrinterAgentStatus } from "@/components/printer/agent-status"
import {
  listPrinters,
  savePrinter,
  deletePrinter,
  setDefaultPrinter,
  testPrinter,
  discoverUsbPrinters,
  discoverNetworkPrinters,
  getPrinterAgentUrl,
  type PrinterConfig,
} from "@/lib/printer-agent-client"

type SettingsTab = "printers" | "account"

type ConnectionType = "tcp" | "usb" | "serial" | "simulate"
type Language = "zpl" | "tspl" | "cpcl" | "sbpl" | "auto"
type Brand = "zebra" | "honeywell" | "tsc" | "citizen" | "sato" | "bixolon" | "generic"

const BRANDS: { value: Brand; label: string }[] = [
  { value: "zebra", label: "Zebra" },
  { value: "honeywell", label: "Honeywell" },
  { value: "tsc", label: "TSC" },
  { value: "citizen", label: "Citizen" },
  { value: "sato", label: "Sato" },
  { value: "bixolon", label: "Bixolon" },
  { value: "generic", label: "Genérica" },
]

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "auto", label: "Auto-detectar" },
  { value: "zpl", label: "ZPL (Zebra / Honeywell)" },
  { value: "tspl", label: "TSPL (TSC)" },
  { value: "cpcl", label: "CPCL (Intermec / Honeywell)" },
  { value: "sbpl", label: "SBPL (Sato)" },
]

const emptyForm: Omit<PrinterConfig, "id"> & { id: string } = {
  id: "",
  name: "",
  brand: "generic",
  connection: "tcp",
  language: "auto",
  host: "",
  port: 9100,
  usbQueue: "",
  serialPort: "",
  baudRate: 9600,
}

function connectionIcon(conn: ConnectionType) {
  if (conn === "tcp") return <Wifi className="h-5 w-5" />
  if (conn === "usb") return <Usb className="h-5 w-5" />
  if (conn === "serial") return <Cable className="h-5 w-5" />
  return <FlaskConical className="h-5 w-5" />
}

function connectionLabel(conn: ConnectionType) {
  if (conn === "tcp") return "Red TCP/IP"
  if (conn === "usb") return "USB"
  if (conn === "serial") return "Serie (RS-232)"
  return "Simulación"
}

function printerSummary(p: PrinterConfig) {
  if (p.connection === "tcp") return `${p.host ?? ""}:${p.port ?? 9100}`
  if (p.connection === "usb") return p.usbQueue ?? "Cola USB"
  if (p.connection === "serial") return `${p.serialPort ?? ""} · ${p.baudRate ?? 9600} baud`
  return "Modo simulación"
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>("printers")

  // --- Agent & printers state ---
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null)
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [defaultId, setDefaultId] = useState<string | null>(null)

  // Discovery
  const [discoveringUsb, setDiscoveringUsb] = useState(false)
  const [usbQueues, setUsbQueues] = useState<string[]>([])
  const [discoveringNet, setDiscoveringNet] = useState(false)
  const [netPrinters, setNetPrinters] = useState<{ ip: string; port: number }[]>([])
  const [subnet, setSubnet] = useState("192.168.1")
  const [showNetDiscovery, setShowNetDiscovery] = useState(false)

  // --- Account state ---
  const [userEmail, setUserEmail] = useState("")
  const [signingOut, setSigningOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    loadAccountData()
  }, [])

  async function loadAccountData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserEmail(user.email ?? "")
  }

  const loadPrinters = useCallback(async () => {
    setLoadingPrinters(true)
    try {
      const list = await listPrinters()
      setPrinters(list)
    } catch {
      // agent offline handled by PrinterAgentStatus
    } finally {
      setLoadingPrinters(false)
    }
  }, [])

  const handleAgentStatus = useCallback((online: boolean) => {
    setAgentOnline(online)
    if (online) loadPrinters()
    else { setPrinters([]); setDefaultId(null) }
  }, [loadPrinters])

  async function handleSavePrinter(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.id) return
    setSaving(true)
    try {
      const config: PrinterConfig = {
        id: form.id.trim().replace(/\s+/g, "-").toLowerCase(),
        name: form.name.trim(),
        brand: form.brand as Brand || undefined,
        connection: form.connection as ConnectionType,
        language: form.language as Language || undefined,
        ...(form.connection === "tcp" ? {
          host: form.host || undefined,
          port: form.port ?? 9100,
        } : {}),
        ...(form.connection === "usb" ? {
          usbQueue: form.usbQueue || undefined,
        } : {}),
        ...(form.connection === "serial" ? {
          serialPort: form.serialPort || undefined,
          baudRate: form.baudRate ?? 9600,
        } : {}),
      }
      await savePrinter(config)
      await loadPrinters()
      setForm({ ...emptyForm })
      setShowAddForm(false)
    } catch (err) {
      alert(`Error al guardar: ${err instanceof Error ? err.message : err}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar la impresora "${id}"?`)) return
    try {
      await deletePrinter(id)
      setPrinters((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(`Error al eliminar: ${err instanceof Error ? err.message : err}`)
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefaultPrinter(id)
      setDefaultId(id)
      await loadPrinters()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : err}`)
    }
  }

  async function handleTest(id: string) {
    setTesting(id)
    setTestResults((prev) => ({ ...prev, [id]: { ok: false, msg: "Probando…" } }))
    try {
      const res = await testPrinter(id)
      setTestResults((prev) => ({
        ...prev,
        [id]: { ok: res.success, msg: res.message ?? (res.success ? "OK" : "Error") }
      }))
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { ok: false, msg: err instanceof Error ? err.message : "Error" }
      }))
    } finally {
      setTesting(null)
    }
  }

  async function handleDiscoverUsb() {
    setDiscoveringUsb(true)
    setUsbQueues([])
    try {
      const list = await discoverUsbPrinters()
      setUsbQueues(list.map((p) => p.Name))
    } catch {
      setUsbQueues([])
    } finally {
      setDiscoveringUsb(false)
    }
  }

  async function handleDiscoverNet() {
    setDiscoveringNet(true)
    setNetPrinters([])
    try {
      const list = await discoverNetworkPrinters(subnet)
      setNetPrinters(list)
    } catch {
      setNetPrinters([])
    } finally {
      setDiscoveringNet(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch {
      setSigningOut(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch("/api/account/delete", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo eliminar la cuenta")
      // Session is already cleared server-side; send the user out.
      router.push("/auth/login")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error desconocido")
      setDeleting(false)
    }
  }

  const agentUrl = getPrinterAgentUrl()

  return (
    <DashboardLayout>
      <Header
        title="Configuración"
        description="Gestioná tus impresoras y tu cuenta"
      />

      <div className="p-6">
        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-48 space-y-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab("printers")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "printers"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Printer className="h-4 w-4" />
              Impresoras
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "account"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
              Cuenta
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-3xl min-w-0">

            {/* ── PRINTERS TAB ── */}
            {activeTab === "printers" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Impresoras</h2>
                    <p className="text-sm text-muted-foreground">
                      Gestioná las impresoras del agente local
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={loadPrinters}
                      disabled={!agentOnline || loadingPrinters}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", loadingPrinters && "animate-spin")} />
                      Actualizar
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={!agentOnline}
                      onClick={() => setShowAddForm(!showAddForm)}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Agent status */}
                <PrinterAgentStatus
                  onStatusChange={(online) => handleAgentStatus(online)}
                  className="rounded-xl border border-border bg-card px-4 py-3"
                />

                {/* Network discovery section */}
                <div className="rounded-xl border border-border bg-card">
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
                    onClick={() => setShowNetDiscovery(!showNetDiscovery)}
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      Descubrir impresoras en la red
                    </span>
                    {showNetDiscovery
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showNetDiscovery && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subnet}
                          onChange={(e) => setSubnet(e.target.value)}
                          placeholder="192.168.1"
                          className="h-8 w-40 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDiscoverNet}
                          disabled={discoveringNet || !agentOnline}
                          className="gap-1.5 h-8 text-xs"
                        >
                          {discoveringNet
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Search className="h-3 w-3" />}
                          Escanear red
                        </Button>
                      </div>
                      {netPrinters.length > 0 && (
                        <div className="space-y-1">
                          {netPrinters.map((p) => (
                            <div key={p.ip} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                              <span className="text-sm font-mono">{p.ip}:{p.port}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => {
                                  setForm({
                                    ...emptyForm,
                                    id: `printer-${p.ip.replace(/\./g, "-")}`,
                                    name: `Impresora ${p.ip}`,
                                    connection: "tcp",
                                    host: p.ip,
                                    port: p.port,
                                  })
                                  setShowAddForm(true)
                                }}
                              >
                                Usar
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {discoveringNet && (
                        <p className="text-xs text-muted-foreground animate-pulse">
                          Escaneando {subnet}.1–254 puerto 9100… (puede tardar ~30s)
                        </p>
                      )}
                      {!discoveringNet && netPrinters.length === 0 && showNetDiscovery && (
                        <p className="text-xs text-muted-foreground">
                          Sin resultados. Ingresá el segmento de red (ej: 192.168.1) y escaneá.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Add / Edit Form */}
                {showAddForm && (
                  <form
                    onSubmit={handleSavePrinter}
                    className="rounded-xl border border-primary bg-card p-5 space-y-4"
                  >
                    <h3 className="font-semibold text-card-foreground">Nueva impresora</h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* ID */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          ID (único) *
                        </label>
                        <input
                          type="text"
                          value={form.id}
                          onChange={(e) => setForm({ ...form, id: e.target.value })}
                          placeholder="honeywell1"
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          required
                        />
                      </div>

                      {/* Name */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Ej: Honeywell PC42tp"
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          required
                        />
                      </div>

                      {/* Brand */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          Marca
                        </label>
                        <select
                          value={form.brand ?? "generic"}
                          onChange={(e) => setForm({ ...form, brand: e.target.value as Brand })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {BRANDS.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Language */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          Lenguaje
                        </label>
                        <select
                          value={form.language ?? "auto"}
                          onChange={(e) => setForm({ ...form, language: e.target.value as Language })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Connection */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          Tipo de conexión
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(["tcp", "usb", "serial", "simulate"] as ConnectionType[]).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setForm({ ...form, connection: c })}
                              className={cn(
                                "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                                form.connection === c
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:border-ring hover:text-foreground"
                              )}
                            >
                              {connectionIcon(c)}
                              {connectionLabel(c)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* TCP fields */}
                      {form.connection === "tcp" && (
                        <>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                              IP / Hostname
                            </label>
                            <input
                              type="text"
                              value={form.host ?? ""}
                              onChange={(e) => setForm({ ...form, host: e.target.value })}
                              placeholder="192.168.1.100"
                              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                              Puerto
                            </label>
                            <input
                              type="number"
                              value={form.port ?? 9100}
                              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
                              placeholder="9100"
                              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                        </>
                      )}

                      {/* USB fields */}
                      {form.connection === "usb" && (
                        <div className="sm:col-span-2 space-y-2">
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="mb-1 block text-xs font-medium text-foreground">
                                Cola de impresión (nombre exacto)
                              </label>
                              <input
                                type="text"
                                value={form.usbQueue ?? ""}
                                onChange={(e) => setForm({ ...form, usbQueue: e.target.value })}
                                placeholder="Honeywell PC42 (USB)"
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleDiscoverUsb}
                              disabled={discoveringUsb || !agentOnline}
                              className="gap-1.5 shrink-0"
                            >
                              {discoveringUsb
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Search className="h-3.5 w-3.5" />}
                              Detectar
                            </Button>
                          </div>
                          {usbQueues.length > 0 && (
                            <div className="space-y-1">
                              {usbQueues.map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => setForm({ ...form, usbQueue: q })}
                                  className={cn(
                                    "w-full rounded-lg border px-3 py-1.5 text-left text-sm transition-colors",
                                    form.usbQueue === q
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-muted/30 hover:border-ring"
                                  )}
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Serial fields */}
                      {form.connection === "serial" && (
                        <>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                              Puerto serie
                            </label>
                            <input
                              type="text"
                              value={form.serialPort ?? ""}
                              onChange={(e) => setForm({ ...form, serialPort: e.target.value })}
                              placeholder="COM3 o /dev/ttyUSB0"
                              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                              Baud rate
                            </label>
                            <select
                              value={form.baudRate ?? 9600}
                              onChange={(e) => setForm({ ...form, baudRate: parseInt(e.target.value) })}
                              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowAddForm(false); setForm({ ...emptyForm }) }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Guardando…</> : "Guardar impresora"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Printer List */}
                {loadingPrinters ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando impresoras…
                  </div>
                ) : agentOnline === false ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                    <Printer className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">El agente no está disponible</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Iniciá el agente:{" "}
                      <code className="rounded bg-muted px-1">cd printer-agent &amp;&amp; npm start</code>
                    </p>
                  </div>
                ) : printers.length === 0 && agentOnline ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                    <Printer className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay impresoras configuradas</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-2"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar impresora
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {printers.map((printer) => {
                      const isDefault = printer.id === defaultId || (printers.indexOf(printer) === 0 && !defaultId && printers.length === 1)
                      const testRes = testResults[printer.id]
                      const isTesting = testing === printer.id
                      return (
                        <div
                          key={printer.id}
                          className={cn(
                            "rounded-xl border bg-card p-4 transition-colors",
                            isDefault ? "border-primary" : "border-border"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                                printer.connection === "tcp"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : printer.connection === "usb"
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                  : printer.connection === "serial"
                                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                  : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                              )}>
                                {connectionIcon(printer.connection)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-card-foreground">
                                    {printer.name}
                                  </span>
                                  {isDefault && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                      Predeterminada
                                    </span>
                                  )}
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                    {connectionLabel(printer.connection)}
                                  </span>
                                  {printer.brand && printer.brand !== "generic" && (
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                                      {printer.brand}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                  {printerSummary(printer)}
                                </p>
                                {printer.language && printer.language !== "auto" && (
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                    {printer.language}
                                  </p>
                                )}
                                {testRes && (
                                  <div className={cn(
                                    "mt-1.5 flex items-center gap-1 text-xs",
                                    testRes.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                  )}>
                                    {testRes.ok
                                      ? <CheckCircle2 className="h-3 w-3" />
                                      : <XCircle className="h-3 w-3" />}
                                    {testRes.msg}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => handleTest(printer.id)}
                                disabled={isTesting}
                                title="Imprimir etiqueta de prueba"
                              >
                                {isTesting
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Play className="h-3.5 w-3.5" />}
                                Test
                              </Button>
                              {!isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs"
                                  onClick={() => handleSetDefault(printer.id)}
                                  title="Establecer como predeterminada"
                                >
                                  <Star className="h-3.5 w-3.5" />
                                  Predeterminar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(printer.id)}
                                title="Eliminar impresora"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Agent info footer */}
                {agentOnline && (
                  <p className="text-xs text-muted-foreground">
                    Agente en{" "}
                    <a
                      href={`${agentUrl}/printers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      {agentUrl}/printers
                    </a>
                    {" "}· Los cambios se guardan en{" "}
                    <code className="rounded bg-muted px-1">printer-agent/printers.json</code>
                  </p>
                )}
              </div>
            )}

            {/* ── ACCOUNT TAB ── */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Cuenta</h2>
                  <p className="text-sm text-muted-foreground">Información de tu cuenta</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
                        {userEmail ? userEmail[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{userEmail}</p>
                        <p className="text-sm text-muted-foreground">Tu correo electrónico</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        readOnly
                        className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        El correo no puede modificarse desde aquí.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground">Sesión</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cerrá tu sesión en este dispositivo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                  </Button>
                </div>

                <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
                  <h3 className="font-semibold text-destructive">Zona de peligro</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Eliminá permanentemente tu cuenta y todos los datos asociados.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => { setShowDeleteConfirm(true); setDeleteText(""); setDeleteError(null) }}
                  >
                    Eliminar cuenta
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete account confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-destructive/50 bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Eliminar cuenta</h3>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Esta acción es <strong className="text-foreground">permanente</strong>. Se borrarán
              tus impresoras, plantillas y trabajos de impresión. No se puede deshacer.
            </p>
            <p className="mt-3 text-sm text-foreground">
              Escribí <code className="rounded bg-muted px-1.5 py-0.5 text-destructive">ELIMINAR</code> para confirmar:
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="ELIMINAR"
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
              autoFocus
            />
            {deleteError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteText !== "ELIMINAR" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting
                  ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Eliminando…</>
                  : "Eliminar definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
