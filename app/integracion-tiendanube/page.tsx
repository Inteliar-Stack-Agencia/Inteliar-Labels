import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, ShoppingBag, Tag, Zap, RefreshCw } from "lucide-react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Etiquetas para Tiendanube — Inteliar Labels",
  description:
    "Importá todos tus productos de Tiendanube y generá etiquetas para tu impresora térmica en minutos. Sin Excel, sin copiar y pegar. Compatible con Zebra, TSC y Godex.",
  keywords: [
    "etiquetas Tiendanube",
    "imprimir etiquetas Tiendanube",
    "etiquetas de productos Tiendanube",
    "software etiquetas Tiendanube",
    "integración Tiendanube etiquetas",
    "etiquetas precio Tiendanube",
    "impresora térmica Tiendanube",
    "Zebra Tiendanube etiquetas",
  ],
  openGraph: {
    title: "Etiquetas para Tiendanube — Inteliar Labels",
    description: "Importá todos tus productos de Tiendanube y empezá a imprimir etiquetas en minutos.",
    url: "https://etiquetar.app/integracion-tiendanube",
  },
}

const benefits = [
  "Importás todos los productos de tu tienda en un clic",
  "Precios, variantes (talle, color), SKU y código de barras incluidos",
  "Etiquetas para impresora térmica: Zebra, TSC, Godex, Bixolon",
  "Diseñador visual: personalizás el layout sin programar",
  "Sincronización de precios cuando actualizás tu tienda",
  "Sin límite de productos — importás catálogos de cualquier tamaño",
  "Funciona offline una vez que descargaste los productos",
  "Trial 15 días gratis — sin tarjeta",
]

const steps = [
  {
    icon: ShoppingBag,
    title: "Pegás la URL de tu tienda",
    desc: "Copiás la dirección de tu tienda Tiendanube (ej: mitienda.mitiendanube.com) y la pegás en Inteliar Labels.",
  },
  {
    icon: Zap,
    title: "Importamos todos tus productos",
    desc: "En segundos traemos nombre, precio, variantes, SKU y código de barras de todos tus productos publicados.",
  },
  {
    icon: Tag,
    title: "Elegís la plantilla de etiqueta",
    desc: "Usás una plantilla prediseñada o creás la tuya con el editor visual. Podés elegir una plantilla distinta por categoría.",
  },
  {
    icon: RefreshCw,
    title: "Imprimís y sincronizás",
    desc: "Mandás a imprimir en tu impresora térmica. Cuando cambien los precios en tu tienda, sincronizás y reimprimir en minutos.",
  },
]

const faqs = [
  {
    q: "¿Funciona con cualquier tienda de Tiendanube?",
    a: "Sí, con tiendas públicas. Solo necesitás pegar la URL de tu tienda. Para tiendas privadas o con contraseña, podés usar el ID numérico de tu tienda (lo encontrás en Configuración → Datos de la tienda en tu panel de TN).",
  },
  {
    q: "¿Qué pasa si tengo miles de productos?",
    a: "No hay límite. Importamos catálogos completos, por más grandes que sean. Podés filtrar por categoría antes de imprimir para solo imprimir lo que necesitás.",
  },
  {
    q: "¿Qué impresoras son compatibles?",
    a: "Cualquier impresora térmica de etiquetas: Zebra, TSC, Godex, Bixolon, Argox y más. Si tenés una impresora de etiquetas, probablemente funcione.",
  },
  {
    q: "¿Tengo que instalar algo?",
    a: "Sí, el agente de impresión de Inteliar Labels (Windows). Es un programa liviano que conecta el editor web con tu impresora térmica. La instalación toma 5 minutos.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "El trial es 15 días gratis sin tarjeta. Después, el plan Mensual arranca en $14.999/mes (ARS) o US$10/mes para otros países.",
  },
]

export default function IntegracionTiendanubePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 border-b border-border">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <ShoppingBag className="w-4 h-4" />
              Integración oficial con Tiendanube
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
              Etiquetas para tu tienda Tiendanube en minutos
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Importá todos tus productos directamente desde Tiendanube e imprimí etiquetas
              de precio, producto y código de barras en tu impresora térmica. Sin Excel, sin copiar y pegar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto group">
                  Empezar gratis — 15 días
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver precios
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Sin tarjeta · Instalación en 5 minutos · Soporte en español</p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
              ¿Cómo funciona?
            </h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 sm:px-6 bg-muted/20 border-y border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
              Todo lo que incluye la integración
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
              Preguntas frecuentes
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-border rounded-xl p-5">
                  <p className="font-semibold text-foreground mb-2">{faq.q}</p>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 bg-primary text-primary-foreground">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Tenés una tienda Tiendanube?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              En menos de un minuto importás todos tus productos y empezás a imprimir etiquetas profesionales.
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="gap-2 group">
                Probarlo gratis
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
