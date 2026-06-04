import { UtensilsCrossed, Truck, Store, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const useCases = [
  {
    icon: UtensilsCrossed,
    industry: "Food Production",
    title: "Expiration & ingredient labels in minutes, not hours",
    description: "Commercial kitchens and food manufacturers use Inteliar to print batch-accurate expiration labels, ingredient lists, and allergen warnings directly from their inventory systems.",
    stats: "Cut labeling time by 85%",
    labels: ["Exp: 04/15/26", "Contains: Milk, Soy", "Batch #2847"],
  },
  {
    icon: Truck,
    industry: "Logistics & Shipping",
    title: "From manifest to printed labels in one click",
    description: "Warehouses and fulfillment centers print shipping labels, packing slips, and tracking barcodes directly from their order exports. No middleware, no delays.",
    stats: "Process 500+ shipments/hour",
    labels: ["TRACK: 1Z999AA10", "SHIP TO: NYC", "2 of 3"],
  },
  {
    icon: Store,
    industry: "Retail & Inventory",
    title: "Price tags and SKU labels that update instantly",
    description: "Retail stores print shelf labels, price tags, and inventory labels from their POS exports. Update pricing across your entire store in minutes.",
    stats: "Update 1000s of prices instantly",
    labels: ["$24.99", "SKU: A-4521", "SALE 20% OFF"],
  },
]

export function UseCasesSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Use Cases</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Built for businesses that print thousands of labels
          </h2>
          <p className="text-lg text-muted-foreground">
            Join hundreds of food producers, warehouses, and retailers who've automated their labeling.
          </p>
        </div>

        <div className="space-y-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-6 sm:p-8 transition-all hover:shadow-lg"
            >
              <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <useCase.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-primary">{useCase.industry}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-foreground">{useCase.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">{useCase.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground bg-muted px-3 py-1.5 rounded-full">
                      {useCase.stats}
                    </span>
                    <Button variant="link" className="text-primary p-0 h-auto gap-1 group">
                      See how it works
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap lg:flex-nowrap">
                  {useCase.labels.map((label, i) => (
                    <div
                      key={i}
                      className="bg-muted border border-border rounded-lg px-4 py-3 text-center min-w-[100px]"
                    >
                      <div className="flex gap-px justify-center mb-2">
                        {[...Array(8)].map((_, j) => (
                          <div
                            key={j}
                            className="w-0.5 bg-foreground/40 rounded-full"
                            style={{ height: `${Math.random() * 12 + 10}px` }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-mono text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
