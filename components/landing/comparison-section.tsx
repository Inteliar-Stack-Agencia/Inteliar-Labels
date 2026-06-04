import { Check, X, Minus } from "lucide-react"

const comparisonData = [
  {
    feature: "Time to first label",
    inteliar: "2 minutes",
    bartender: "Hours to days",
    inteliarBetter: true,
  },
  {
    feature: "Learning curve",
    inteliar: "None",
    bartender: "Steep",
    inteliarBetter: true,
  },
  {
    feature: "Installation required",
    inteliar: "No",
    bartender: "Yes",
    inteliarBetter: true,
  },
  {
    feature: "Monthly cost",
    inteliar: "From $10",
    bartender: "$500+/seat",
    inteliarBetter: true,
  },
  {
    feature: "Excel native support",
    inteliar: "Yes",
    bartender: "Limited",
    inteliarBetter: true,
  },
  {
    feature: "Bulk printing speed",
    inteliar: "100+/minute",
    bartender: "Manual",
    inteliarBetter: true,
  },
  {
    feature: "Updates & maintenance",
    inteliar: "Automatic",
    bartender: "Manual",
    inteliarBetter: true,
  },
  {
    feature: "Team collaboration",
    inteliar: "Built-in",
    bartender: "Complex setup",
    inteliarBetter: true,
  },
]

export function ComparisonSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Comparison</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Why businesses are switching from BarTender
          </h2>
          <p className="text-lg text-muted-foreground">
            Enterprise labeling software shouldn't require enterprise budgets and IT teams.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
            <div className="p-4 sm:p-6">
              <span className="text-sm font-medium text-muted-foreground">Feature</span>
            </div>
            <div className="p-4 sm:p-6 text-center border-x border-border bg-primary/5">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">I</span>
                </div>
                <span className="font-semibold text-foreground">Inteliar</span>
              </div>
            </div>
            <div className="p-4 sm:p-6 text-center">
              <span className="font-semibold text-muted-foreground">BarTender</span>
            </div>
          </div>

          {comparisonData.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 ${
                index < comparisonData.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="p-4 sm:p-6 flex items-center">
                <span className="text-sm text-foreground">{row.feature}</span>
              </div>
              <div className="p-4 sm:p-6 flex items-center justify-center border-x border-border bg-primary/5">
                {row.inteliar === "Yes" ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ) : row.inteliar === "No" ? (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                ) : (
                  <span className="text-sm font-medium text-foreground">{row.inteliar}</span>
                )}
              </div>
              <div className="p-4 sm:p-6 flex items-center justify-center">
                {row.bartender === "Yes" ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ) : row.bartender === "No" ? (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                ) : row.bartender === "Limited" ? (
                  <div className="flex items-center gap-2">
                    <Minus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{row.bartender}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{row.bartender}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Still not convinced?{" "}
          <a href="#" className="text-primary hover:underline">
            See the full comparison
          </a>
        </p>
      </div>
    </section>
  )
}
