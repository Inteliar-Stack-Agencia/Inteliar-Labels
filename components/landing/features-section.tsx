import { Zap, Code, FileSpreadsheet, Printer, Cloud, Shield } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Blazing Fast Bulk Printing",
    description: "Print hundreds of labels in seconds, not minutes. Your thermal printer becomes a production machine.",
    highlight: "100+ labels/minute",
  },
  {
    icon: Code,
    title: "Dynamic Templates",
    description: "Use {{variables}} to automatically pull data from your spreadsheet into each label. No manual entry.",
    highlight: "Zero manual input",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel & CSV Native",
    description: "Works with the files you already have. No data conversion or reformatting required.",
    highlight: "Drag & drop ready",
  },
  {
    icon: Printer,
    title: "Any Thermal Printer",
    description: "ZPL, EPL, CPCL—we speak your printer's language. Zebra, Dymo, Brother, and more.",
    highlight: "Universal compatibility",
  },
  {
    icon: Cloud,
    title: "Nothing to Install",
    description: "100% cloud-based. Works in your browser on any device. Always up to date automatically.",
    highlight: "Start in 2 minutes",
  },
  {
    icon: Shield,
    title: "Enterprise Reliable",
    description: "99.9% uptime. Your labels print when you need them. Period.",
    highlight: "24/7 availability",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Everything you need, nothing you don't
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for speed and simplicity. Designed by people who've wasted too many hours on BarTender.
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
