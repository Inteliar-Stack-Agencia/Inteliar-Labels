"use client"

import { useState, useEffect, useCallback } from "react"
import { listPrinters, type PrinterConfig } from "@/lib/printer-agent-client"
import { Wifi, Usb, Cable, FlaskConical, ChevronDown, Printer } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  /** Currently selected printer id (undefined = use agent default) */
  value?: string
  onChange?: (printerId: string | undefined, printer: PrinterConfig | undefined) => void
  /** Re-fetch the list when this changes (e.g. when agent comes online) */
  online?: boolean
  className?: string
  disabled?: boolean
}

function connIcon(conn: PrinterConfig["connection"]) {
  if (conn === "tcp") return <Wifi className="h-4 w-4" />
  if (conn === "usb") return <Usb className="h-4 w-4" />
  if (conn === "serial") return <Cable className="h-4 w-4" />
  return <FlaskConical className="h-4 w-4" />
}

function summary(p: PrinterConfig) {
  if (p.connection === "tcp") return `${p.host ?? ""}:${p.port ?? 9100}`
  if (p.connection === "usb") return p.usbQueue ?? "USB"
  if (p.connection === "serial") return p.serialPort ?? "Serie"
  return "Simulación"
}

export function PrinterSelector({ value, onChange, online, className, disabled }: Props) {
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listPrinters()
      setPrinters(list)
    } catch {
      setPrinters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (online !== false) load()
  }, [online, load])

  const selected = value ? printers.find((p) => p.id === value) : undefined

  // Don't show a selector when there's 0 or 1 printer — default handles it.
  if (printers.length <= 1) return null

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-ring focus:outline-none focus:ring-1 focus:ring-ring",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Printer className="h-4 w-4 text-muted-foreground shrink-0" />
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground">{connIcon(selected.connection)}</span>
            <span className="font-medium truncate">{selected.name}</span>
            <span className="text-xs text-muted-foreground font-mono truncate hidden sm:inline">
              {summary(selected)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Impresora por defecto</span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full min-w-[14rem] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <button
              type="button"
              onClick={() => { onChange?.(undefined, undefined); setOpen(false) }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                !value && "bg-muted/50"
              )}
            >
              <Printer className="h-4 w-4 text-muted-foreground" />
              Impresora por defecto
            </button>
            <div className="border-t border-border" />
            {printers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange?.(p.id, p); setOpen(false) }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                  value === p.id && "bg-muted/50"
                )}
              >
                <span className="text-muted-foreground shrink-0">{connIcon(p.connection)}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{p.name}</span>
                  <span className="block text-xs text-muted-foreground font-mono truncate">
                    {summary(p)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
