import { CheckCircle2 } from "lucide-react"

const items = [
  "Sin tarjeta de crédito",
  "15 días de prueba gratis",
  "Instalación en menos de 5 minutos",
  "Compatible con Windows",
  "Zebra, TSC, Honeywell, Godex, Brother y Bixolon",
  "Soporte en español",
]

export function TrustBar() {
  return (
    <div className="border-y border-border bg-muted/30 py-4 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
