"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowRight, X, Printer, CheckCircle2, Archive, Trash2 } from "lucide-react"
import { sendToPrinterAgent } from "@/lib/printer-agent-client"
import { IMPORT_HANDOFF_KEY, type ImportHandoff } from "@/lib/import-handoff"
import { createClient } from "@/lib/supabase/client"

interface ChecklistEntry {
  id: string
  order_id: string
  preparado: boolean
  despachado: boolean
}

type Source = "ml" | "tn"

export default function IntegracionesPage() {
  const router = useRouter()
  const supabase = createClient()

  // Tiendanube — cuenta conectada (OAuth, órdenes + catálogo)
  const [tnAcctStatus, setTnAcctStatus] = useState<{ configured: boolean; connected: boolean } | null>(null)
  const [tnAcctLoading, setTnAcctLoading] = useState(false)
  const [tnAcctError, setTnAcctError] = useState("")
  const [tnAcctNotice, setTnAcctNotice] = useState("")

  // Mercado Libre
  const [mlStatus, setMlStatus] = useState<{ configured: boolean; connected: boolean; storefrontDomain?: string } | null>(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState("")
  const [mlNotice, setMlNotice] = useState("")
  const [mlLabelResult, setMlLabelResult] = useState<{ count: number } | null>(null)

  // Datos de comprador (control interno) — compartido entre ML y Tiendanube.
  // Cada fila lleva su propio _source para poder mezclar ambos canales en
  // una sola tabla ("Ver todos los pedidos").
  const [buyerData, setBuyerData] = useState<{ columns: string[]; rows: (Record<string, string> & { _source: Source })[] } | null>(null)
  const [checklist, setChecklist] = useState<Record<string, ChecklistEntry>>({})
  const checklistKey = (source: Source, orderId: string) => `${source}:${orderId}`

  useEffect(() => {
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
    } else if (params.get("tn_connected")) {
      setTnAcctNotice("Cuenta de Tiendanube conectada.")
      setTnAcctStatus({ configured: true, connected: true })
      window.history.replaceState({}, "", window.location.pathname)
    } else if (params.get("tn_error")) {
      const code = params.get("tn_error")
      setTnAcctError(
        code === "not_configured"
          ? "La conexión de cuenta con Tiendanube todavía no está configurada."
          : "No se pudo conectar con Tiendanube. Probá de nuevo."
      )
      window.history.replaceState({}, "", window.location.pathname)
    }

    fetch("/api/integrations/mercadolibre/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setMlStatus(s))
      .catch(() => {})

    fetch("/api/integrations/tiendanube/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setTnAcctStatus(s))
      .catch(() => {})
  }, [])

  function goToUpload(handoff: ImportHandoff) {
    sessionStorage.setItem(IMPORT_HANDOFF_KEY, JSON.stringify(handoff))
    router.push("/upload?imported=1")
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

  const importFromTiendanubeOrders = async (mode: "shipping" | "product") => {
    setTnAcctLoading(true)
    setTnAcctError("")
    try {
      const res = await fetch("/api/integrations/tiendanube/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      const result = await res.json()
      if (!res.ok) { setTnAcctError(result.error || "Error al importar órdenes."); return }
      goToUpload({
        columns: result.columns,
        rows: result.rows,
        fileName: `Tiendanube · ${mode === "shipping" ? "envíos" : "productos"}`,
        totalRows: result.total,
      })
    } catch {
      setTnAcctError("No se pudo importar desde Tiendanube.")
    } finally {
      setTnAcctLoading(false)
    }
  }

  const importCatalogFromTiendanube = async () => {
    setTnAcctLoading(true)
    setTnAcctError("")
    try {
      const res = await fetch("/api/integrations/tiendanube/catalog", { method: "POST" })
      const result = await res.json()
      if (!res.ok) { setTnAcctError(result.error || "Error al importar el catálogo."); return }
      goToUpload({ columns: result.columns, rows: result.rows, fileName: "Tiendanube · catálogo", totalRows: result.total })
    } catch {
      setTnAcctError("No se pudo importar el catálogo de Tiendanube.")
    } finally {
      setTnAcctLoading(false)
    }
  }

  const disconnectTiendanube = async () => {
    setTnAcctLoading(true)
    try {
      await fetch("/api/integrations/tiendanube/disconnect", { method: "POST" })
      setTnAcctStatus((s) => (s ? { ...s, connected: false } : s))
    } finally {
      setTnAcctLoading(false)
    }
  }

  const ORDERS_ENDPOINT: Record<Source, string> = {
    ml: "/api/integrations/mercadolibre/orders",
    tn: "/api/integrations/tiendanube/orders",
  }

  // Datos del comprador: solo para chequeo visual antes de despachar, no se
  // manda a imprimir (evita tener que cambiar de rollo entre la etiqueta
  // oficial de 10×15/19 y una etiqueta propia de otro tamaño).
  // Acepta uno o varios canales a la vez (para la vista combinada).
  const viewBuyerData = async (sources: Source[]) => {
    const multi = sources.length > 1
    const setLoading = multi ? setMlLoading : sources[0] === "ml" ? setMlLoading : setTnAcctLoading
    const setError = multi ? setMlError : sources[0] === "ml" ? setMlError : setTnAcctError
    setLoading(true)
    setError("")
    try {
      const results = await Promise.all(
        sources.map(async (source) => {
          const res = await fetch(ORDERS_ENDPOINT[source], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "shipping" }),
          })
          const result = await res.json()
          return { source, ok: res.ok, result }
        })
      )

      const failed = results.filter((r) => !r.ok && r.result?.error !== "No encontramos órdenes pagas recientes.")
      if (failed.length > 0 && results.every((r) => !r.ok)) {
        setError(failed[0].result?.error || "Error al traer las órdenes.")
        return
      }

      const columns = results.find((r) => r.ok)?.result.columns ?? []
      let rows: (Record<string, string> & { _source: Source })[] = results.flatMap((r) =>
        r.ok ? r.result.rows.map((row: Record<string, string>) => ({ ...row, _source: r.source })) : []
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: entries } = await supabase
          .from("ml_order_checklist")
          .select("id, order_id, source, preparado, despachado, archivado")
          .eq("user_id", user.id)
          .in("source", sources)
        const archivedKeys = new Set((entries ?? []).filter((e) => e.archivado).map((e) => checklistKey(e.source, e.order_id)))
        rows = rows.filter((r) => !archivedKeys.has(checklistKey(r._source, r.nro_orden)))
        const map: Record<string, ChecklistEntry> = {}
        for (const e of entries ?? []) {
          if (!e.archivado) map[checklistKey(e.source, e.order_id)] = { id: e.id, order_id: e.order_id, preparado: e.preparado, despachado: e.despachado }
        }
        setChecklist(map)
      }
      setBuyerData({ columns, rows })
    } catch {
      setError("No se pudieron traer los pedidos.")
    } finally {
      setLoading(false)
    }
  }

  async function toggleChecklist(source: Source, orderId: string, field: "preparado" | "despachado") {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const key = checklistKey(source, orderId)
    const existing = checklist[key]
    const next = { preparado: existing?.preparado ?? false, despachado: existing?.despachado ?? false, [field]: !existing?.[field] }
    const { data: saved } = await supabase
      .from("ml_order_checklist")
      .upsert({ user_id: user.id, order_id: orderId, source, ...next }, { onConflict: "user_id,source,order_id" })
      .select("id, order_id, preparado, despachado")
      .single()
    if (saved) setChecklist((prev) => ({ ...prev, [key]: saved }))
  }

  async function archiveChecklistRow(source: Source, orderId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("ml_order_checklist")
      .upsert({ user_id: user.id, order_id: orderId, source, archivado: true }, { onConflict: "user_id,source,order_id" })
    setBuyerData((prev) => prev && { ...prev, rows: prev.rows.filter((r) => !(r._source === source && r.nro_orden === orderId)) })
  }

  async function deleteChecklistRow(source: Source, orderId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("ml_order_checklist").delete().eq("user_id", user.id).eq("source", source).eq("order_id", orderId)
    setChecklist((prev) => {
      const next = { ...prev }
      delete next[checklistKey(source, orderId)]
      return next
    })
    setBuyerData((prev) => prev && { ...prev, rows: prev.rows.filter((r) => !(r._source === source && r.nro_orden === orderId)) })
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
      <DashboardLayout>
        <Header title="Integraciones" description="Traé tus productos y pedidos directo desde Tiendanube o Mercado Libre" />
        <div className="p-6 space-y-4 max-w-3xl">
          {mlStatus?.connected && tnAcctStatus?.connected && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Ver todos los pedidos (multicanal)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Mercado Libre + Tiendanube juntos en una sola lista, con columna de canal.</p>
              </div>
              <Button size="sm" className="gap-2 flex-shrink-0" onClick={() => viewBuyerData(["ml", "tn"])} disabled={mlLoading || tnAcctLoading}>
                {(mlLoading || tnAcctLoading) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Ver todos
              </Button>
            </div>
          )}

          {/* Tiendanube — cuenta conectada (órdenes + catálogo) */}
          <div className="rounded-xl border border-border bg-card p-5">
            {tnAcctError && <p className="text-xs text-destructive mb-2">{tnAcctError}</p>}
            {tnAcctNotice && <p className="text-xs text-green-600 dark:text-green-400 mb-2">{tnAcctNotice}</p>}
            {tnAcctStatus?.connected ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <img src="/logos/tiendanube-icon.svg" alt="" className="h-4 w-4" />
                    Tiendanube (cuenta) · Conectado
                  </p>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={disconnectTiendanube} disabled={tnAcctLoading}>
                    Desconectar
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 min-w-0">
                    <p className="text-xs text-muted-foreground leading-snug">
                      Trae nombre, SKU, cantidad y precio de lo vendido en tus pedidos pagos — para etiquetar el producto en sí, no el envío.
                    </p>
                    <Button size="sm" className="gap-2 mt-auto w-full whitespace-normal h-auto py-2 bg-[#0433ff] hover:bg-[#0433ff]/90 text-white" onClick={() => importFromTiendanubeOrders("product")} disabled={tnAcctLoading}>
                      {tnAcctLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" /> : <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
                      Importar productos vendidos
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 min-w-0">
                    <p className="text-xs text-muted-foreground leading-snug">
                      Trae todo tu catálogo publicado con precios y SKU — no solo lo vendido, sirve para etiquetas de góndola/precio.
                    </p>
                    <Button size="sm" variant="outline" className="gap-2 mt-auto w-full whitespace-normal h-auto py-2" onClick={importCatalogFromTiendanube} disabled={tnAcctLoading}>
                      {tnAcctLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" /> : <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
                      Importar catálogo de productos
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <img src="/logos/tiendanube-icon.svg" alt="" className="h-4 w-4" />
                    Conectar cuenta de Tiendanube
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Traé tus pedidos pagos (envío y producto) autorizando tu tienda — no solo el catálogo público</p>
                </div>
                {tnAcctStatus?.configured ? (
                  <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" asChild>
                    <a href="/api/integrations/tiendanube/authorize">
                      <img src="/logos/tiendanube-icon.svg" alt="" className="h-4 w-4" />
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
              <p className="text-xs font-medium text-foreground mb-1">⚠️ Qué no podemos automatizar todavía (limitación de Tiendanube, no nuestra)</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ningún método de envío de Tiendanube (Envío Nube, Correo Argentino/MiCorreo, Andreani, Pickit)
                expone por API la etiqueta oficial con el código de seguimiento del correo — lo confirmamos directo
                con el soporte de Tiendanube. Por eso acá no hay botón de "imprimir etiqueta oficial" como sí tenemos
                para Mercado Libre: hay que generarla e imprimirla manualmente desde el panel de Tiendanube
                (o desde MiCorreo/Andreani, según el método que uses) antes de despachar.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                Lo que sí traemos automatizado: datos de comprador para chequeo interno, productos vendidos para
                picking, y tu catálogo completo con precio y SKU para etiquetas propias — nada de esto reemplaza
                la etiqueta oficial, es un complemento.
              </p>
            </div>
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
                    <img src="/logos/mercadolibre-icon.png" alt="" className="h-4 w-4 object-contain" />
                    Mercado Libre · Conectado
                  </p>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={disconnectMercadolibre} disabled={mlLoading}>
                    Desconectar
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 min-w-0">
                    <p className="text-xs text-muted-foreground leading-snug">
                      La etiqueta que genera Mercado Envíos, con el código de seguimiento que escanea el correo. Es la que va pegada en el paquete.
                    </p>
                    <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-black mt-auto w-full whitespace-normal h-auto py-2" onClick={printOfficialShippingLabels} disabled={mlLoading}>
                      {mlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" /> : <Printer className="h-3.5 w-3.5 flex-shrink-0" />}
                      Imprimir etiquetas oficiales de envío
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 min-w-0">
                    <p className="text-xs text-muted-foreground leading-snug">
                      Muestra destinatario, dirección y teléfono en pantalla para que chequees el paquete antes de despacharlo — no imprime nada, así no hay que cambiar de rollo.
                    </p>
                    <Button size="sm" variant="outline" className="gap-2 mt-auto w-full whitespace-normal h-auto py-2" onClick={() => viewBuyerData(["ml"])} disabled={mlLoading}>
                      {mlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" /> : <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
                      Ver datos de comprador (control interno)
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 min-w-0">
                    <p className="text-xs text-muted-foreground leading-snug">
                      Trae nombre, SKU, cantidad y precio de lo vendido — para etiquetar el producto en sí (picking en depósito, talles, etc.), no el envío.
                    </p>
                    <Button size="sm" variant="outline" className="gap-2 mt-auto w-full whitespace-normal h-auto py-2" onClick={() => importFromMercadolibre("product")} disabled={mlLoading}>
                      {mlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" /> : <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
                      Importar etiquetas de producto
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <img src="/logos/mercadolibre-icon.png" alt="" className="h-4 w-4 object-contain" />
                    Importar desde Mercado Libre
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Etiquetas oficiales de envío y etiquetas de producto de tus órdenes pagas</p>
                </div>
                {mlStatus?.configured ? (
                  <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" asChild>
                    <a href="/api/integrations/mercadolibre/authorize">
                      <img src="/logos/mercadolibre-icon.png" alt="" className="h-4 w-4 object-contain" />
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
                  href={`https://www.${mlStatus?.storefrontDomain || "mercadolibre.com.ar"}/preferencias-de-venta`}
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

      {buyerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-[97vw] max-h-[94vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Datos de comprador</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Solo para chequeo — no se imprime nada.</p>
              </div>
              <button onClick={() => setBuyerData(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-auto">
              {buyerData.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No encontramos órdenes pagas recientes.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">Canal</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">Preparado</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">Despachado</th>
                      {buyerData.columns.map((col) => (
                        <th key={col} className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                      ))}
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {buyerData.rows.map((row, i) => {
                      const orderId = row.nro_orden
                      const source = row._source
                      const entry = checklist[checklistKey(source, orderId)]
                      return (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <img
                                src={source === "ml" ? "/logos/mercadolibre-icon.png" : "/logos/tiendanube-icon.svg"}
                                alt=""
                                className="h-3.5 w-3.5 object-contain"
                              />
                              <span className="text-xs text-muted-foreground">{source === "ml" ? "Mercado Libre" : "Tiendanube"}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={entry?.preparado ?? false}
                              onChange={() => toggleChecklist(source, orderId, "preparado")}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={entry?.despachado ?? false}
                              onChange={() => toggleChecklist(source, orderId, "despachado")}
                            />
                          </td>
                          {buyerData.columns.map((col) => (
                            <td key={col} className="px-3 py-2.5 text-foreground whitespace-nowrap">{row[col] || <span className="text-muted-foreground">—</span>}</td>
                          ))}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                title="Archivar"
                                onClick={() => archiveChecklistRow(source, orderId)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                              <button
                                title="Eliminar"
                                onClick={() => deleteChecklistRow(source, orderId)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
