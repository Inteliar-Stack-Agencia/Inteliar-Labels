import { Upload, Layout, Printer, ArrowRight } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Subí tus datos",
    description: "Arrastrá y soltá tu archivo Excel o CSV. Detectamos las columnas automáticamente y las mapeamos a los campos de la etiqueta.",
  },
  {
    number: "02",
    icon: Layout,
    title: "Elegí tu template",
    description: "Usá los templates listos o creá el tuyo. Usá {{variables}} para traer datos directamente desde tu planilla.",
  },
  {
    number: "03",
    icon: Printer,
    title: "Imprimí todo",
    description: "Tocá imprimir y mirá cómo salen 100+ etiquetas en segundos. Listo. Sin configuraciones complicadas ni curva de aprendizaje.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            De la planilla a las etiquetas impresas en 60 segundos
          </h2>
          <p className="text-lg text-muted-foreground">
            Sin instalaciones. Sin configuraciones complejas. Solo resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="bg-card border border-border rounded-2xl p-8 h-full transition-all hover:shadow-lg hover:border-primary/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-5xl font-bold text-muted/50">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
