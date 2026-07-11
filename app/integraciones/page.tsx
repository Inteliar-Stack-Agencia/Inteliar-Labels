"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Loader2, RefreshCw, ArrowRight, X, Printer, CheckCircle2 } from "lucide-react"
import { sendToPrinterAgent } from "@/lib/printer-agent-client"
import { IMPORT_HANDOFF_KEY, type ImportHandoff } from "@/lib/import-handoff"

export default function IntegracionesPage() {
  const router = useRouter()

  // Tiendanube
  const [showTNModal, setShowTNModal] = useState(false)
  const [tnUrl, setTnUrl] = useState("")
  const [tnLoading, setTnLoading] = useState(false)
  const [tnError, setTnError] = useState("")
  const [tnLastSync, setTnLastSync] = useState<{ url: string; syncedAt: string; total: number } | null>(null)

  // Mercado Libre
  const [mlStatus, setMlStatus] = useState<{ configured: boolean; connected: boolean } | null>(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState("")
  const [mlNotice, setMlNotice] = useState("")
  const [mlLabelResult, setMlLabelResult] = useState<{ count: number } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tn_last_sync")
      if (raw) setTnLastSync(JSON.parse(raw))
    } catch {}

    const params = new URLSearchParams(window.location.search)
    if (params.get("ml_connected")) {
      setMlNotice("Cuenta de Mercado Libre conectada.")
      setMlStatus({ configured: true, connected: true })
      window.history.replaceState({}, "", window.location.pathname)
    } else if (params.get("ml_error")) {
      const code = params.get("ml_error")
      setMlError(
        code === "not_configured"
          ? "La integración con Mercado Libre todavía no está configurada."
          : "No se pudo conectar con Mercado Libre. Probá de nuevo."
      )
      window.history.replaceState({}, "", window.location.pathname)
    }

    fetch("/api/integrations/mercadolibre/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setMlStatus(s))
      .catch(() => {})
  }, [])

  function goToUpload(handoff: ImportHandoff) {
    sessionStorage.setItem(IMPORT_HANDOFF_KEY, JSON.stringify(handoff))
    router.push("/upload?imported=1")
  }

  const importFromTiendanube = async () => {
    if (!tnUrl.trim()) { setTnError("Ingresá la URL de tu tienda."); return }
    setTnLoading(true)
    setTnError("")
    try {
      const res = await fetch("/api/tiendanube/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: tnUrl.trim() }),
      })
      const result = await res.json()
      if (!res.ok) { setTnError(result.error || "No se pudo conectar con la tienda."); return }
      const syncInfo = { url: tnUrl.trim(), syncedAt: new Date().toISOString(), total: result.total }
      localStorage.setItem("tn_last_sync", JSON.stringify(syncInfo))
      setTnLastSync(syncInfo)
      setShowTNModal(false)
      goToUpload({ columns: result.columns, rows: result.rows, fileName: `Tiendanube · ${tnUrl.trim()}`, totalRows: result.total })
    } catch {
      setTnError("No se pudo conectar con Tiendanube.")
    } finally {
      setTnLoading(false)
    }
  }

  const resyncTiendanube = async () => {
    if (!tnLastSync) return
    setTnLoading(true)
    setTnError("")
    try {
      const res = await fetch("/api/tiendanube/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: tnLastSync.url }),
      })
      const result = await res.json()
      if (!res.ok) { setTnError(result.error || "Error al sincronizar."); return }
      const syncInfo = { url: tnLastSync.url, syncedAt: new Date().toISOString(), total: result.total }
      localStorage.setItem("tn_last_sync", JSON.stringify(syncInfo))
      setTnLastSync(syncInfo)
      goToUpload({ columns: result.columns, rows: result.rows, fileName: `Tiendanube · ${tnLastSync.url}`, totalRows: result.total })
    } catch {
      setTnError("No se pudo sincronizar.")
    } finally {
      setTnLoading(false)
    }
  }

  const importFromMercadolibre = async (mode: "shipping" | "product") => {
    setMlLoading(true)
    setMlError("")
    try {
      const res = await fetch("/api/integrations/mercadolibre/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      const result = await res.json()
      if (!res.ok) { setMlError(result.error || "Error al importar órdenes."); return }
      goToUpload({
        columns: result.columns,
        rows: result.rows,
        fileName: `Mercado Libre · ${mode === "shipping" ? "envíos" : "productos"}`,
        totalRows: result.total,
      })
    } catch {
      setMlError("No se pudo importar desde Mercado Libre.")
    } finally {
      setMlLoading(false)
    }
  }

  const printOfficialShippingLabels = async () => {
    setMlLoading(true)
    setMlError("")
    setMlLabelResult(null)
    try {
      const res = await fetch("/api/integrations/mercadolibre/shipping-labels", { method: "POST" })
      const result = await res.json()
      if (!res.ok) { setMlError(result.error || "Error al traer las etiquetas."); return }
      await sendToPrinterAgent(result.zpl, "zpl")
      setMlLabelResult({ count: result.count })
    } catch (e: any) {
      setMlError(e.message || "No se pudieron imprimir las etiquetas oficiales.")
    } finally {
      setMlLoading(false)
    }
  }

  const disconnectMercadolibre = async () => {
    setMlLoading(true)
    try {
      await fetch("/api/integrations/mercadolibre/disconnect", { method: "POST" })
      setMlStatus((s) => (s ? { ...s, connected: false } : s))
    } finally {
      setMlLoading(false)
    }
  }

  return (
    <>
      {showTNModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#14cce4]" />
                Importar desde Tiendanube
              </h3>
              <button onClick={() => { setShowTNModal(false); setTnError("") }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Pegá la URL de tu tienda y traemos todos los productos automáticamente.
            </p>
            <input
              type="text"
              placeholder="mitienda.mitiendanube.com"
              value={tnUrl}
              onChange={(e) => { setTnUrl(e.target.value); setTnError("") }}
              onKeyDown={(e) => e.key === "Enter" && importFromTiendanube()}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-1"
            />
            {tnError && <p className="text-xs text-destructive mt-1 mb-2">{tnError}</p>}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowTNModal(false); setTnError("") }}>
                Cancelar
              </Button>
              <Button className="flex-1 gap-2" onClick={importFromTiendanube} disabled={tnLoading}>
                {tnLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {tnLoading ? "Importando..." : "Importar productos"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Solo funciona con tiendas públicas. Para tiendas privadas, usá el ID numérico de tu tienda.
            </p>
          </div>
        </div>
      )}

      <DashboardLayout>
        <Header title="Integraciones" description="Traé tus productos y pedidos directo desde Tiendanube o Mercado Libre" />
        <div className="p-6 space-y-4 max-w-3xl">
          {/* Tiendanube */}
          <div className="rounded-xl border border-border bg-card p-5">
            {tnLastSync ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-[#14cce4]" />
                      Tiendanube · Conectado
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{tnLastSync.url}</p>
                  </div>
                  <span className="text-xs text-muted-foreground text-right flex-shrink-0">
                    {tnLastSync.total} productos<br />
                    {new Date(tnLastSync.syncedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                {tnError && <p className="text-xs text-destructive">{tnError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="gap-2" onClick={resyncTiendanube} disabled={tnLoading}>
                    {tnLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Sincronizar ahora
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowTNModal(true)}>
                    Cambiar tienda
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#14cce4]" />
                    Importar desde Tiendanube
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Traé tus productos directo sin pasar por Excel</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" onClick={() => setShowTNModal(true)}>
                  <ShoppingBag className="h-4 w-4" />
                  Conectar tienda
                </Button>
              </div>
            )}
          </div>

          {/* Mercado Libre */}
          <div className="rounded-xl border border-border bg-card p-5">
            {mlError && <p className="text-xs text-destructive mb-2">{mlError}</p>}
            {mlNotice && <p className="text-xs text-green-600 dark:text-green-400 mb-2">{mlNotice}</p>}
            {mlLabelResult && (
              <p className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Se enviaron {mlLabelResult.count} etiqueta{mlLabelResult.count !== 1 ? "s" : ""} oficial{mlLabelResult.count !== 1 ? "es" : ""} de envío a la impresora.
              </p>
            )}
            {mlStatus?.connected ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#FFE600]" />
                    Mercado Libre · Conectado
                  </p>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={disconnectMercadolibre} disabled={mlLoading}>
                    Desconectar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-black" onClick={printOfficialShippingLabels} disabled={mlLoading}>
                    {mlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                    Imprimir etiquetas oficiales de envío
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => importFromMercadolibre("shipping")} disabled={mlLoading}>
                    {mlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    Importar datos de comprador (control interno)
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  "Etiquetas oficiales" es la misma que genera Mercado Envíos (con su código de seguimiento) —
                  se manda directo a tu impresora térmica. La otra opción arma una plantilla propia con los datos del comprador.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#FFE600]" />
                    Importar desde Mercado Libre
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Etiquetas oficiales de envío y etiquetas de producto de tus órdenes pagas</p>
                </div>
                {mlStatus?.configured ? (
                  <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" asChild>
                    <a href="/api/integrations/mercadolibre/authorize">
                      <ShoppingBag className="h-4 w-4" />
                      Conectar cuenta
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex-shrink-0">
                    Próximamente
                  </span>
                )}
              </div>
            )}
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-medium text-foreground mb-1">📋 Recomendación: tamaño de papel</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                La etiqueta oficial de Mercado Envíos se imprime en <strong>10×15cm (sin troquel)</strong> o{" "}
                <strong>10×19cm (con troquel)</strong>, según lo que tengas configurado en{" "}
                <a
                  href="https://www.mercadolibre.com.ar/preferencias-de-venta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  tu cuenta de Mercado Libre → Preferencias de venta
                </a>
                . Ese tamaño no se puede elegir desde acá ni por la API: lo define únicamente esa configuración.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                <strong>Sin troquel:</strong> rollo de papel térmico continuo (sin cortes preimpresos), el más común.{" "}
                <strong>Con troquel:</strong> rollo de etiquetas ya separadas físicamente, con un espacio en blanco
                entre una y otra, que la impresora detecta con sensor — necesitás haber comprado ese insumo específico.
                Antes de imprimir, verificá que la opción elegida coincida con el papel que tenés cargado en tu
                impresora, para evitar que la etiqueta salga cortada o con espacio de más.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
