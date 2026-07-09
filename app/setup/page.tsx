"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { checkPrinterAgent, listPrinters, testPrinter, type PrinterConfig } from "@/lib/printer-agent-client"
import { analytics } from "@/lib/analytics"
import {
  Tag,
  Download,
  CheckCircle2,
  Circle,
  Loader2,
  Printer,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

const AGENT_DOWNLOAD_URL = "https://github.com/Inteliar-Stack-Agencia/Inteliar-Labels/releases/latest/download/InteliarPrinterAgent.exe"

const STEPS = ["Bienvenida", "Agente", "Impresora", "Calibración", "Prueba", "Listo"] as const

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-8 bg-primary" : i < current ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
          )}
        />
      ))}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Tag className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Inteliar Labels</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function SetupWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Agent detection
  const [agentOnline, setAgentOnline] = useState(false)
  const [checkingAgent, setCheckingAgent] = useState(false)

  // Printers
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | undefined>(undefined)

  // Calibration confirm
  const [calibrated, setCalibrated] = useState(false)

  // Test print
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const checkAgent = useCallback(async () => {
    setCheckingAgent(true)
    try {
      await checkPrinterAgent()
      setAgentOnline(true)
      const list = await listPrinters().catch(() => [])
      setPrinters(list)
      if (list.length === 1) setSelectedPrinterId(list[0].id)
    } catch {
      setAgentOnline(false)
    } finally {
      setCheckingAgent(false)
    }
  }, [])

  // Poll for the agent while on the "download & install" step
  useEffect(() => {
    if (step !== 1 || agentOnline) return
    checkAgent()
    const t = setInterval(checkAgent, 4000)
    return () => clearInterval(t)
  }, [step, agentOnline, checkAgent])

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleTestPrint = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      if (!selectedPrinterId) throw new Error("No hay una impresora seleccionada.")
      const result = await testPrinter(selectedPrinterId)
      if (result.success) {
        setTestResult({ ok: true, message: "¡Etiqueta enviada! Revisá que haya salido bien de la impresora." })
      } else {
        setTestResult({ ok: false, message: result.error ?? result.message ?? "La impresora no confirmó la impresión." })
      }
    } catch (err) {
      setTestResult({ ok: false, message: (err as Error).message })
    } finally {
      setTesting(false)
    }
  }

  const finish = async () => {
    try {
      const supabase = createClient()
      localStorage.setItem("setup_wizard_done", "1")
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "setup_wizard_completed" }),
      }).catch(() => {})
    } catch {}
    router.push("/templates/new")
  }

  return (
    <Shell>
      <StepDots current={step} />

      {/* STEP 0 — Bienvenida */}
      {step === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Vamos a dejar todo listo</h1>
          <p className="text-sm text-muted-foreground">
            En unos minutos vas a tener tu impresora conectada y vas a haber sacado tu primera
            etiqueta de prueba. Son 4 pasos cortos.
          </p>
          <Button size="lg" className="gap-2 w-full" onClick={goNext}>
            Empezar <ArrowRight className="h-4 w-4" />
          </Button>
          <button onClick={() => router.push("/dashboard")} className="text-xs text-muted-foreground hover:text-foreground">
            Saltear, prefiero explorar solo
          </button>
        </div>
      )}

      {/* STEP 1 — Descargar e instalar el agente */}
      {step === 1 && (
        <div className="rounded-xl border border-border bg-card p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Instalá el agente de impresión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Es un programa liviano para Windows que conecta tu navegador con la impresora térmica.
              Se instala una sola vez.
            </p>
          </div>

          <a
            href={AGENT_DOWNLOAD_URL}
            onClick={() => analytics.agentDownloaded()}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Descargar agente (.exe)
          </a>

          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Descargá y ejecutá el instalador.</li>
            <li>Si Windows muestra una advertencia, hacé clic en "Más información → Ejecutar de todas formas".</li>
            <li>Dejalo abierto — corre en segundo plano.</li>
          </ol>

          <div className={cn(
            "flex items-center gap-3 rounded-lg border p-4 text-sm",
            agentOnline
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-border bg-muted/30 text-muted-foreground"
          )}>
            {agentOnline ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : checkingAgent ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <Circle className="h-5 w-5 shrink-0" />
            )}
            <span>{agentOnline ? "Agente detectado — ¡ya está corriendo!" : "Esperando a que se instale y abra el agente…"}</span>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" className="gap-2" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
            <Button className="gap-2" onClick={goNext} disabled={!agentOnline}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 — Elegir impresora */}
      {step === 2 && (
        <div className="rounded-xl border border-border bg-card p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Elegí tu impresora</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {printers.length === 0
                ? "No detectamos ninguna impresora configurada en el agente todavía."
                : "Detectamos estas impresoras conectadas:"}
            </p>
          </div>

          {printers.length === 0 ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400 space-y-2">
              <p>Abrí el agente (ícono en la bandeja del sistema, cerca del reloj de Windows) y agregá tu impresora ahí — USB, red o serie.</p>
              <button onClick={checkAgent} className="flex items-center gap-1.5 font-medium hover:underline">
                <RefreshCw className="h-3.5 w-3.5" /> Volver a buscar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {printers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPrinterId(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    selectedPrinterId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Printer className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.connection.toUpperCase()}</p>
                  </div>
                  {selectedPrinterId === p.id && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" className="gap-2" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
            <Button className="gap-2" onClick={goNext} disabled={!selectedPrinterId}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Calibración */}
      {step === 3 && (
        <div className="rounded-xl border border-border bg-card p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Calibrá el rollo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cada vez que ponés un rollo nuevo (o cambiás de tamaño de etiqueta), la impresora
              necesita calibrarse para detectar dónde termina cada etiqueta. Si no la calibrás,
              el contenido sale corrido.
            </p>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-2 text-sm">
            <p className="font-medium text-foreground">Honeywell PC42t y similares:</p>
            <p className="text-muted-foreground">
              Mantené presionado el botón de alimentación (feed) unos 3-5 segundos hasta que la
              impresora avance un par de etiquetas sola. Soltá — ya quedó calibrada.
            </p>
            <p className="text-muted-foreground">
              Algunas marcas traen una utilidad del fabricante (ej: <em>PrintSet</em> de Honeywell)
              con la opción "Media Calibration" / "Calibrar". Ver más detalle en{" "}
              <Link href="/ayuda" target="_blank" className="text-primary hover:underline">/ayuda</Link>.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={calibrated}
              onChange={(e) => setCalibrated(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Ya calibré mi rollo (o no hace falta, ya estaba calibrado)
          </label>

          <div className="flex justify-between">
            <Button variant="ghost" className="gap-2" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
            <Button className="gap-2" onClick={goNext} disabled={!calibrated}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4 — Etiqueta de prueba */}
      {step === 4 && (
        <div className="rounded-xl border border-border bg-card p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Imprimí una etiqueta de prueba</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Le mandamos una etiqueta de prueba directo a tu impresora para confirmar que todo
              quedó bien conectado.
            </p>
          </div>

          {testResult && (
            <div className={cn(
              "flex items-start gap-3 rounded-lg border p-4 text-sm",
              testResult.ok
                ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
            )}>
              {testResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {!testResult?.ok && (
            <Button size="lg" className="gap-2 w-full" onClick={handleTestPrint} disabled={testing}>
              <Printer className="h-4 w-4" />
              {testing ? "Imprimiendo…" : "Imprimir etiqueta de prueba"}
            </Button>
          )}

          {testResult && !testResult.ok && (
            <p className="text-xs text-muted-foreground">
              Verificá que la impresora esté encendida, con papel cargado y sin atascos. Si sigue
              sin funcionar, mirá{" "}
              <Link href="/ayuda" target="_blank" className="text-primary hover:underline">solución de problemas</Link>{" "}
              o escribinos por WhatsApp desde el menú de ayuda.
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" className="gap-2" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
            <Button className="gap-2" onClick={goNext} disabled={!testResult?.ok}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5 — Listo */}
      {step === 5 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">¡Todo listo!</h1>
          <p className="text-sm text-muted-foreground">
            Tu impresora ya está conectada. Ahora armemos tu primera plantilla para empezar a
            imprimir tus propias etiquetas.
          </p>
          <Button size="lg" className="gap-2 w-full" onClick={finish}>
            Crear mi primera plantilla <ArrowRight className="h-4 w-4" />
          </Button>
          <button onClick={() => router.push("/dashboard")} className="text-xs text-muted-foreground hover:text-foreground">
            Ir al panel
          </button>
        </div>
      )}
    </Shell>
  )
}
