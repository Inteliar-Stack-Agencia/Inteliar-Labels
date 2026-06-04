import { Zap, Code, FileSpreadsheet, Printer, Cloud, Shield } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Impresión masiva ultrarrápida",
    description: "Imprimí cientos de etiquetas en segundos, no en minutos. Tu impresora térmica se convierte en una máquina de producción.",
    highlight: "100+ etiquetas/minuto",
  },
  {
    icon: Code,
    title: "Templates dinámicos",
    description: "Usá {{variables}} para traer datos automáticamente desde tu planilla a cada etiqueta. Sin carga manual.",
    highlight: "Cero carga manual",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel y CSV nativos",
    description: "Funciona con los archivos que ya tenés. Sin conversiones ni reformateo.",
    highlight: "Arrastrá y soltá",
  },
  {
    icon: Printer,
    title: "Cualquier impresora térmica",
    description: "ZPL, EPL, CPCL: hablamos el idioma de tu impresora. Zebra, Honeywell, Brother y más.",
    highlight: "Compatibilidad universal",
  },
  {
    icon: Cloud,
    title: "Nada que instalar",
    description: "100% en la nube. Funciona en tu navegador en cualquier dispositivo. Siempre actualizado.",
    highlight: "Listo en 2 minutos",
  },
  {
    icon: Shield,
    title: "Confiable para tu negocio",
    description: "99.9% de uptime. Tus etiquetas se imprimen cuando las necesitás. Punto.",
    highlight: "Disponibilidad 24/7",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Funcionalidades</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Todo lo que necesitás, nada que te sobre
          </h2>
          <p className="text-lg text-muted-foreground">
            Pensado para velocidad y simpleza. Diseñado por gente que perdió demasiadas horas con BarTender.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 transition-all hover:shadow-lg hover:border-primary/20 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                {feature.highlight}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
