"use client"

import { useState, useEffect, useCallback } from "react"
import { checkPrinterAgent, getPrinterAgentUrl } from "@/lib/printer-agent-client"
import { Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  onStatusChange?: (online: boolean, simulate: boolean) => void
  className?: string
}

export function PrinterAgentStatus({ onStatusChange, className }: Props) {
  const [online, setOnline] = useState<boolean | null>(null)
  const [simulate, setSimulate] = useState(true)
  const [printerIp, setPrinterIp] = useState<string | null>(null)
  const [agentUrl, setAgentUrl] = useState(getPrinterAgentUrl())
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState(agentUrl)

  const check = useCallback(async (url = agentUrl) => {
    try {
      const s = await checkPrinterAgent(url)
      setOnline(true)
      setSimulate(s.printer.simulate)
      setPrinterIp(s.printer.ip)
      onStatusChange?.(true, s.printer.simulate)
    } catch {
      setOnline(false)
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

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            online === null
              ? "bg-muted text-muted-foreground"
              : online
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              online === null
                ? "animate-pulse bg-muted-foreground"
                : online
                ? "bg-green-500"
                : "bg-red-500"
            )}
          />
          {online === null
            ? "Verificando agente..."
            : online
            ? simulate
              ? "Agente activo · Modo simulación"
              : `Agente activo · ${printerIp}`
            : "Agente offline"}
        </span>
        <button
          onClick={() => setEditingUrl(!editingUrl)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          title="Configurar URL del agente"
        >
          {editingUrl ? <X className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
        </button>
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

      {online && simulate && (
        <p className="text-xs text-muted-foreground">
          En modo simulación no se envía a la impresora. Configurá{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">SIMULATE=false</code>{" "}
          en <code className="rounded bg-muted px-1 py-0.5 text-[10px]">printer-agent/.env</code>
        </p>
      )}
    </div>
  )
}
