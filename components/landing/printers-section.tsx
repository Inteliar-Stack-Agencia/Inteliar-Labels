const PRINTERS = [
  { name: "Zebra", tagline: "ZPL · USB · Red" },
  { name: "Honeywell", tagline: "ZPL · USB · Red" },
  { name: "TSC", tagline: "TSPL · USB · Red" },
  { name: "Citizen", tagline: "CPCL · USB · Red" },
  { name: "Sato", tagline: "SBPL · Red" },
  { name: "Bixolon", tagline: "ZPL · USB · Red" },
  { name: "Brother", tagline: "ZPL · USB" },
  { name: "Godex", tagline: "TSPL · USB · Red" },
]

export function PrintersSection() {
  return (
    <section className="py-16 px-4 sm:px-6 border-y border-border bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wide">
          Compatible con las principales impresoras térmicas del mercado
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {PRINTERS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square rounded-xl border border-border bg-card flex items-center justify-center p-3 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                <span className="text-xs font-bold text-foreground text-center leading-tight">{p.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground text-center hidden sm:block">{p.tagline}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          ¿Tu impresora no está en la lista?{" "}
          <a href="mailto:inteliarstack.ia@gmail.com?subject=Compatibilidad%20impresora" className="text-primary hover:underline">
            Consultanos
          </a>
          {" "}— si habla ZPL o TSPL, funciona.
        </p>
      </div>
    </section>
  )
}
