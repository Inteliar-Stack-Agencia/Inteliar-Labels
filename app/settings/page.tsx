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
    name: "Brother QL-820NWB",
    ip: "192.168.1.101",
    type: "network",
    status: "online",
    isDefault: false,
  },
  {
    id: "3",
    name: "Local Printer Agent",
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
    name: "John Doe",
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
        title="Settings"
        description="Manage your printers and account"
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
              Printers
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
              Account
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-3xl">
            {activeTab === "printers" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Printer Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configure your label printers and print agents
                    </p>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Printer
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
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {printer.type === "network" ? "IP: " : "Address: "}
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
                                {printer.status === "online" ? "Online" : "Offline"}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {printer.type} printer
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
                            Test
                          </Button>
                          {!printer.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultPrinter(printer.id)}
                            >
                              Set Default
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
                    Local Print Agent
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Install the local print agent to print directly from your computer without network configuration.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="sm">
                      Download for Windows
                    </Button>
                    <Button variant="outline" size="sm">
                      Download for macOS
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Account Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your account information
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
                          Change Avatar
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">
                          JPG, GIF or PNG. 1MB max.
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid gap-4 pt-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          Full Name
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
                          Email Address
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
                          Company
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
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
                  <h3 className="font-semibold text-destructive">
                    Danger Zone
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Delete Account
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
