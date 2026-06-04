import { Upload, Layout, Printer, ArrowRight } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Data",
    description: "Drag and drop your Excel or CSV file. We automatically detect your columns and map them to label fields.",
  },
  {
    number: "02",
    icon: Layout,
    title: "Pick Your Template",
    description: "Choose from pre-built templates or create your own. Use {{variables}} to pull data directly from your spreadsheet.",
  },
  {
    number: "03",
    icon: Printer,
    title: "Print Everything",
    description: "Hit print and watch 100+ labels come out in seconds. That's it. No complex setup, no learning curve.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            From spreadsheet to printed labels in 60 seconds
          </h2>
          <p className="text-lg text-muted-foreground">
            No software to install. No complex configuration. Just results.
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
