"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  FileStack,
  Upload,
  Printer,
  Clock,
  Settings,
  Tag,
  PrinterCheck,
  LogOut,
  HelpCircle,
  BookOpen,
  MessageCircle,
  ShoppingBag,
} from "lucide-react"

const SUPPORT_WHATSAPP = "5491165689145"

const navigation = [
  { name: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Templates", href: "/templates", icon: FileStack },
  { name: "Imprimir", href: "/imprimir", icon: PrinterCheck },
  { name: "Cargar Excel", href: "/upload", icon: Upload },
  { name: "Integraciones", href: "/integraciones", icon: ShoppingBag },
  { name: "Trabajos", href: "/jobs", icon: Printer },
  { name: "Historial", href: "/history", icon: Clock },
  { name: "Configuración", href: "/settings", icon: Settings },
  { name: "Manual", href: "/manual", icon: BookOpen },
  { name: "Ayuda", href: "/ayuda", icon: HelpCircle },
]

function getInitials(name: string, email: string): string {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [initials, setInitials] = useState("··")

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const name = user.user_metadata?.full_name || user.user_metadata?.name || ""
      const userEmail = user.email || ""
      setDisplayName(name || userEmail.split("@")[0])
      setEmail(userEmail)
      setInitials(getInitials(name, userEmail))
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Tag className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">
          Inteliar Labels
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}

        {/* Support via WhatsApp — prefilled, identified message */}
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
            `Hola! 👋 Te escribo desde *Inteliar Labels* (impresión de etiquetas).\n` +
            ((displayName || email) ? `Soy ${[displayName, email && `(${email})`].filter(Boolean).join(" ")}.\n` : "") +
            `Necesito ayuda con: `
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 transition-colors hover:bg-green-500/10"
        >
          <MessageCircle className="h-4 w-4" />
          Soporte WhatsApp
        </a>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {displayName || "···"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {email || "···"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
