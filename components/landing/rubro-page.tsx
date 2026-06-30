import Link from "next/link"
import { Printer, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface RubroPageProps {
  title: string
  subtitle: string
  description: string
  problem: string
  solution: string
  benefits: string[]
  useCases: { icon: string; title: string; desc: string }[]
  templates: { name: string; size: string; desc: string }[]
  cta: string
  slug: string
}

export function RubroPage({
  title, subtitle, description, problem, solution,
  benefits, useCases, templates, cta, slug,
}: RubroPageProps) {
  const APP_URL = "https://etiquetar.app"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border py-4 px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Printer className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Inteliar Labels</span>
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 text-center bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-4">{subtitle}</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance leading-tight">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 gap-2 group" asChild>
                <a href={`${APP_URL}/auth/register`}>
                  {cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                <Link href="/#pricing">Ver planes y precios</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">15 días gratis · Sin tarjeta · Listo en 5 minutos</p>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="py-16 px-4 sm:px-6 border-t border-border">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <p className="text-sm font-medium text-red-600 uppercase tracking-wide mb-3">El problema</p>
              <p className="text-foreground leading-relaxed">{problem}</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-3">La solución</p>
              <p className="text-foreground leading-relaxed">{solution}</p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4 sm:px-6 bg-muted/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Por qué Inteliar Labels es ideal para tu negocio
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Casos de uso frecuentes
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {useCases.map((uc, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-4">{uc.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="py-16 px-4 sm:px-6 bg-muted/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-3">
              Plantillas listas para usar
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              Empezá desde una plantilla y personalizala en minutos con el diseñador visual.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {templates.map((t, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">{t.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.size}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Empezá hoy gratis
            </h2>
            <p className="text-muted-foreground mb-8">
              15 días de prueba gratuita, sin tarjeta. Configuración en menos de 5 minutos.
            </p>
            <Button size="lg" className="h-12 px-10 gap-2 group" asChild>
              <a href={`${APP_URL}/auth/register`}>
                {cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer simple */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <Link href="/#pricing" className="hover:text-foreground transition-colors">Precios</Link>
          <Link href="/manual" className="hover:text-foreground transition-colors">Manual</Link>
          <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
          <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
        </div>
        <p>© {new Date().getFullYear()} Inteliar Labels · Desarrollado por <a href="https://inteliarstack.com" className="hover:text-foreground transition-colors">Inteliar Stack</a></p>
      </footer>
    </div>
  )
}
