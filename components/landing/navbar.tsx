"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Printer } from "lucide-react"
import { analytics } from "@/lib/analytics"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-shadow duration-300 ${scrolled ? "shadow-lg" : ""}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Printer className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">Inteliar Labels</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cómo funciona
            </a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#descargar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Descarga
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
            <a href="/manual" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Manual
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <a href="/auth/login">Iniciar sesión</a>
            </Button>
            <Button size="sm" asChild className={scrolled ? "ring-2 ring-primary/30 animate-pulse" : ""}>
              <a href="/auth/register">{scrolled ? "Empezá gratis · 15 días" : "Probar gratis"}</a>
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menú"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cómo funciona
              </a>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#descargar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Descarga
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Precios
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
              <a href="/manual" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Manual
              </a>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/auth/login">Iniciar sesión</a>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <a href="/auth/register">Probar gratis</a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
