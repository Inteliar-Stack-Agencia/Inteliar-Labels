"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Wifi, Usb, Cable, CheckCircle2 } from "lucide-react"

const PRINTERS = [
  {
    name: "Zebra",
    protocol: "ZPL",
    models: ["GK420d", "ZD220", "ZD420", "ZT410"],
    connections: ["usb", "tcp"],
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    name: "Honeywell",
    protocol: "ZPL",
    models: ["PC42t", "PM42", "PC45", "PX240"],
    connections: ["usb", "tcp"],
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  {
    name: "TSC",
    protocol: "TSPL",
    models: ["TTP-225", "TTP-244", "DA200", "TE244"],
    connections: ["usb", "tcp"],
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  {
    name: "Citizen",
    protocol: "CPCL",
    models: ["CL-S521", "CL-S631", "CL-S700", "CLP-521"],
    connections: ["usb", "tcp", "serial"],
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    name: "Sato",
    protocol: "SBPL",
    models: ["CL4NX", "CL6NX", "CT4-LX", "S84-ex"],
    connections: ["tcp", "serial"],
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    name: "Bixolon",
    protocol: "ZPL",
    models: ["SLP-TX400", "SLP-DX420", "SLP-TX223", "XT5-40"],
    connections: ["usb", "tcp"],
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    name: "Godex",
    protocol: "TSPL",
    models: ["G500", "G530", "EZ-2350i", "RT700"],
    connections: ["usb", "tcp"],
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    name: "Brother",
    protocol: "ZPL",
    models: ["TD-4550DNWB", "TD-4420DN", "QL-1110NWB"],
    connections: ["usb", "tcp"],
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
  },
]

function ConnIcon({ type }: { type: string }) {
  if (type === "tcp") return <Wifi className="w-3 h-3" />
  if (type === "usb") return <Usb className="w-3 h-3" />
  return <Cable className="w-3 h-3" />
}

function connLabel(type: string) {
  if (type === "tcp") return "Red"
  if (type === "usb") return "USB"
  return "Serie"
}

export function PrintersSection() {
  const [active, setActive] = useState<string | null>(null)
  const activePrinter = PRINTERS.find(p => p.name === active)

  return (
    <section className="py-16 px-4 sm:px-6 border-y border-border bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wide">
          Compatible con las principales impresoras térmicas del mercado
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
          {PRINTERS.map((p) => (
            <button
              key={p.name}
              onClick={() => setActive(active === p.name ? null : p.name)}
              className={cn(
                "flex flex-col items-center gap-2 group outline-none",
              )}
            >
              <div className={cn(
                "w-full aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all",
                active === p.name
                  ? `border-primary ${p.bg} shadow-sm`
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
              )}>
                <span className={cn(
                  "text-xs font-bold text-center leading-tight transition-colors",
                  active === p.name ? p.color : "text-foreground"
                )}>
                  {p.name}
                </span>
                <span className={cn(
                  "text-[9px] font-mono mt-0.5 transition-colors",
                  active === p.name ? p.color : "text-muted-foreground"
                )}>
                  {p.protocol}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {activePrinter && (
          <div className={cn(
            "rounded-xl border border-border bg-card p-5 mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
          )}>
            <div className="flex flex-wrap items-start gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-lg font-bold", activePrinter.color)}>{activePrinter.name}</span>
                  <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{activePrinter.protocol}</span>
                </div>
                <div className="flex gap-2">
                  {activePrinter.connections.map(c => (
                    <span key={c} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <ConnIcon type={c} />
                      {connLabel(c)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Modelos compatibles</p>
                <div className="flex flex-wrap gap-2">
                  {activePrinter.models.map(m => (
                    <span key={m} className="flex items-center gap-1 text-xs bg-muted/60 border border-border px-2 py-1 rounded-lg text-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ¿Tu impresora no está en la lista?{" "}
          <a href="mailto:inteliarstack.ia@gmail.com?subject=Compatibilidad%20impresora" className="text-primary hover:underline">
            Consultanos
          </a>
          {" "}— si habla ZPL o TSPL, funciona.
        </p>
      </div>
    </section>
  )
}
