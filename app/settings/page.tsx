"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Printer,
  User,
  Wifi,
  Monitor,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PrinterConfig {
  id: string
  name: string
  ip: string
  type: "network" | "local"
  status: "online" | "offline"
  isDefault: boolean
}

const mockPrinters: PrinterConfig[] = [
  {
    id: "1",
    name: "Zebra ZD420",
    ip: "192.168.1.100",
    type: "network",
    status: "online",
    isDefault: true,
  },
  {
    id: "2",
    name: "Honeywell PC42",
    ip: "192.168.1.101",
    type: "network",
    status: "online",
    isDefault: false,
  },
  {
    id: "3",
    name: "Agente local de impresión",
    ip: "localhost:8080",
    type: "local",
    status: "offline",
    isDefault: false,
  },
]

type SettingsTab = "printers" | "account"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("printers")
  const [printers, setPrinters] = useState(mockPrinters)
  const [accountForm, setAccountForm] = useState({
    name: "Juan Pérez",
    email: "admin@inteliar.com",
    company: "Inteliar Industries",
  })

  const testConnection = (printerId: string) => {
    // Simulate connection test
    setPrinters(printers.map(p => 
      p.id === printerId 
        ? { ...p, status: Math.random() > 0.3 ? "online" : "offline" as const }
        : p
    ))
  }

  const setDefaultPrinter = (printerId: string) => {
    setPrinters(printers.map(p => ({
      ...p,
      isDefault: p.id === printerId
    })))
  }

  return (
    <DashboardLayout>
      <Header
        title="Configuración"
        description="Gestioná tus impresoras y tu cuenta"
      />

      <div className="p-6">
        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-48 space-y-1">
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
          <div className="flex-1 max-w-3xl">
            {activeTab === "printers" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Configuración de impresoras
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configurá tus impresoras de etiquetas y agentes de impresión
                    </p>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar impresora
                  </Button>
                </div>

                {/* Printer List */}
                <div className="space-y-4">
                  {printers.map((printer) => (
                    <div
                      key={printer.id}
                      className={cn(
                        "rounded-xl border bg-card p-6",
                        printer.isDefault ? "border-primary" : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-lg",
                              printer.type === "network"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {printer.type === "network" ? (
                              <Wifi className="h-6 w-6" />
                            ) : (
                              <Monitor className="h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-card-foreground">
                                {printer.name}
                              </h3>
                              {printer.isDefault && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  Predeterminada
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {printer.type === "network" ? "IP: " : "Dirección: "}
                              {printer.ip}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                                  printer.status === "online"
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                                )}
                              >
                                {printer.status === "online" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {printer.status === "online" ? "En línea" : "Fuera de línea"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Impresora {printer.type === "network" ? "de red" : "local"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => testConnection(printer.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Probar
                          </Button>
                          {!printer.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultPrinter(printer.id)}
                            >
                              Predeterminar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Local Agent Info */}
                <div className="rounded-xl border border-border bg-muted/30 p-6">
                  <h3 className="font-semibold text-foreground">
                    Agente local de impresión
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Instalá el agente local para imprimir directamente desde tu computadora sin configurar red.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="sm">
                      Descargar para Windows
                    </Button>
                    <Button variant="outline" size="sm">
                      Descargar para macOS
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Configuración de la cuenta
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Gestioná la información de tu cuenta
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
                        {accountForm.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          Cambiar avatar
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">
                          JPG, GIF o PNG. 1 MB máximo.
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid gap-4 pt-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          value={accountForm.name}
                          onChange={(e) =>
                            setAccountForm({ ...accountForm, name: e.target.value })
                          }
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          value={accountForm.email}
                          onChange={(e) =>
                            setAccountForm({ ...accountForm, email: e.target.value })
                          }
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={accountForm.company}
                          onChange={(e) =>
                            setAccountForm({ ...accountForm, company: e.target.value })
                          }
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button className="gap-2">
                        <Save className="h-4 w-4" />
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
                  <h3 className="font-semibold text-destructive">
                    Zona de peligro
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Eliminá permanentemente tu cuenta y todos los datos asociados.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Eliminar cuenta
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
