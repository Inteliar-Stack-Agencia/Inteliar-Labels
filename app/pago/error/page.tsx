import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { whatsappLink } from "@/lib/contact"

export default function PagoErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <XCircle className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">El pago no se completó</h1>
        <p className="text-muted-foreground text-lg">
          Hubo un problema con tu pago. No se realizó ningún cobro.
          Podés intentarlo de nuevo o contactarnos.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild>
            <a href="/#pricing">Volver a los planes</a>
          </Button>
          <Button variant="outline" asChild>
            <a href={whatsappLink("Hola, tuve un problema con el pago en Inteliar Labels")} target="_blank" rel="noopener noreferrer">
              Contactar por WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
