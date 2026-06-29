import { Zap, Code, FileSpreadsheet, Printer, Sparkles, History, Monitor } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Impresión masiva desde Excel",
    description: "Subí tu planilla, seleccioná las filas que querés imprimir y listo. También podés reusar listas guardadas de sesiones anteriores.",
    highlight: "Excel y CSV nativos",
  },
  {
    icon: Code,
    title: "Templates con variables",
    description: "Usá {{producto}}, {{precio}}, {{sku}} y más para traer datos automáticamente desde tu planilla a cada etiqueta. Sin carga manual.",
    highlight: "Cero carga manual",
  },
  {
    icon: Sparkles,
    title: "Diseñador visual + IA",
    description: "Diseñá tu etiqueta visualmente o describila en texto y la IA la genera por vos. Incluye vista previa real con tus datos.",
    highlight: "Generación con IA",
  },
  {
    icon: Printer,
    title: "Impresoras térmicas ZPL/TSPL",
    description: "Compatible con Zebra, Honeywell, TSC, Citizen, Sato y más. Conexión por red TCP/IP, USB o serial vía agente local.",
    highlight: "Agente de escritorio",
  },
  {
    icon: FileSpreadsheet,
    title: "Códigos de barras y QR",
    description: "EAN-13, EAN-8, Code 128, Code 39, QR y DataMatrix. Generados automáticamente desde los datos de tu planilla.",
    highlight: "Múltiples formatos",
  },
  {
    icon: History,
    title: "Historial y reimpresión",
    description: "Todos los trabajos quedan guardados. Podés reimprimir cualquier lote con un clic, sin volver a cargar el Excel.",
    highlight: "Reimpresión instantánea",
  },
  {
    icon: Monitor,
    title: "Control de sucursales y dispositivos",
    description: "Cada licencia se activa por dispositivo. Desde tu panel podés ver qué PCs tienen el agente activo y desactivar cualquiera al instante — sin llamar a soporte.",
    highlight: "Gestión desde el panel",
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
