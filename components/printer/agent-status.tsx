"use client"

import { useState, useEffect, useCallback } from "react"
import { checkPrinterAgent, getPrinterAgentUrl, type AgentStatus } from "@/lib/printer-agent-client"
import { Settings, X, Printer } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  onStatusChange?: (online: boolean, simulate: boolean) => void
  className?: string
}

export function PrinterAgentStatus({ onStatusChange, className }: Props) {
  const [online, setOnline] = useState<boolean | null>(null)
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [agentUrl, setAgentUrl] = useState(getPrinterAgentUrl())
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState(agentUrl)

  const check = useCallback(async (url = agentUrl) => {
    try {
      const s = await checkPrinterAgent(url)
      setOnline(true)
      setStatus(s)
      const isSimulate = s.defaultPrinter?.connection === 'simulate' || s.printer?.simulate === true
      onStatusChange?.(true, isSimulate)
      // Record that this user actually has the agent running (once per day),
      // so the admin can see who really installed & connected it.
      if (typeof window !== "undefined") {
        const key = `agent_connected_${new Date().toISOString().slice(0, 10)}`
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "1")
          fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "agent_connected", metadata: { printer: s.defaultPrinter?.name ?? null } }),
            keepalive: true,
          }).catch(() => {})
        }
      }
    } catch {
      setOnline(false)
      setStatus(null)
      onStatusChange?.(false, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentUrl])

  useEffect(() => {
    check()
    const t = setInterval(check, 15000)
    return () => clearInterval(t)
  }, [check])

  const saveUrl = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("printerAgentUrl", urlInput)
    }
    setAgentUrl(urlInput)
    setEditingUrl(false)
    check(urlInput)
  }

  const defaultPrinter = status?.defaultPrinter
  const isSimulate = defaultPrinter?.connection === 'simulate' || status?.printer?.simulate === true
  const printerLabel = defaultPrinter
    ? defaultPrinter.connection === 'tcp'
      ? `${defaultPrinter.name} · ${defaultPrinter.host}:${defaultPrinter.port ?? 9100}`
      : defaultPrinter.connection === 'usb'
      ? `${defaultPrinter.name} · USB`
      : defaultPrinter.connection === 'serial'
      ? `${defaultPrinter.name} · ${defaultPrinter.serialPort}`
      : `${defaultPrinter.name} · Simulación`
    : status?.printer?.ip
    ? status.printer.ip
    : 'Sin impresora'

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            online === null
              ? "bg-muted text-muted-foreground"
              : online
              ? isSimulate
                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                : "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              online === null
                ? "animate-pulse bg-muted-foreground"
                : online
                ? isSimulate ? "bg-yellow-500" : "bg-green-500"
                : "bg-red-500"
            )}
          />
          {online === null
            ? "Verificando agente..."
            : online
            ? isSimulate
              ? `Simulación · ${printerLabel}`
              : `Conectado · ${printerLabel}`
            : "Agente offline"}
        </span>
        <button
          onClick={() => setEditingUrl(!editingUrl)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          title="Configurar URL del agente"
        >
          {editingUrl ? <X className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
        </button>
        {online && (
          <a
            href={`${agentUrl.replace(/\/$/, '')}/printers`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            title="Ver impresoras configuradas"
          >
            <Printer className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {editingUrl && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveUrl()}
            className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="http://localhost:9638"
          />
          <button
            onClick={saveUrl}
            className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
          >
            OK
          </button>
        </div>
      )}

      {online === false && (
        <p className="text-xs text-muted-foreground">
          Iniciá el agente:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
            cd printer-agent &amp;&amp; npm start
          </code>
        </p>
      )}

      {online && isSimulate && (
        <p className="text-xs text-muted-foreground">
          En simulación no se envía a la impresora.{" "}
          <a
            href={`${agentUrl.replace(/\/$/, '')}/printers`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Configurar impresora real →
          </a>
        </p>
      )}
    </div>
  )
}
