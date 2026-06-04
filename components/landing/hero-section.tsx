import { Button } from "@/components/ui/button"
import { ArrowRight, Play, CheckCircle2 } from "lucide-react"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">Used by 500+ businesses worldwide</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] text-balance">
              Stop wasting hours.{" "}
              <span className="text-primary">Print 100+ labels</span> in seconds.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Ditch expensive, complex label software. Upload your Excel, pick a template, 
              and print instantly to any thermal printer. No training needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base h-12 px-8 gap-2 group">
                Start Free — No Credit Card
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="text-base h-12 px-8 gap-2">
                <Play className="w-4 h-4" />
                Watch 2-Min Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Works with any thermal printer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground">Inteliar Labels</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 text-xs font-semibold">XLS</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">products_batch_042.xlsx</p>
                      <p className="text-xs text-muted-foreground">247 items ready to print</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Loaded</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[3/4] bg-muted/30 rounded-lg border border-border p-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-foreground/10 rounded" />
                        <div className="h-2 w-3/4 bg-foreground/10 rounded" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-6 w-full bg-foreground/5 rounded flex items-center justify-center">
                          <div className="flex gap-0.5">
                            {[...Array(8)].map((_, j) => (
                              <div key={j} className="w-0.5 h-4 bg-foreground/20 rounded-full" style={{ height: `${Math.random() * 12 + 8}px` }} />
                            ))}
                          </div>
                        </div>
                        <div className="h-1.5 w-1/2 bg-foreground/10 rounded mx-auto" />
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full h-11 text-base">
                  Print All 247 Labels
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
