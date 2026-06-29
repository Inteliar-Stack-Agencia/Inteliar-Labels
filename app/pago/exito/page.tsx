import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PagoExitoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">¡Pago recibido!</h1>
        <p className="text-muted-foreground text-lg">
          Tu licencia está siendo procesada. En los próximos minutos vas a recibir
          un email con tu clave de activación.
        </p>
        <p className="text-sm text-muted-foreground">
          Revisá tu bandeja de entrada (y la carpeta de spam por las dudas).
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild>
            <a href="/dashboard">Ir al dashboard</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://wa.me/5491165689145?text=Hola%2C%20acabo%20de%20pagar%20y%20quiero%20activar%20mi%20licencia" target="_blank" rel="noopener noreferrer">
              Contactar por WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
