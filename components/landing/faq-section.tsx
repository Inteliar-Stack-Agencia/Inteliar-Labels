"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "¿Funciona con mi impresora?",
    answer:
      "Si tu impresora habla ZPL o TSPL, funciona. Eso incluye Zebra, Honeywell, TSC, Citizen, Sato, Bixolon, Brother y Godex. Si no estás seguro, escribinos y te confirmamos.",
  },
  {
    question: "¿Necesito instalar algo?",
    answer:
      "El diseñador y la carga de datos son 100% web, sin instalación. Para enviar a tu impresora térmica instalás un agente pequeño en tu PC con Windows (2 minutos). Mac y Linux están en roadmap.",
  },
  {
    question: "¿Qué pasa cuando vence el trial?",
    answer:
      "Después de 15 días o 500 impresiones (lo que llegue primero), el sistema se bloquea hasta que activés una licencia. Todo tu trabajo y templates quedan guardados.",
  },
  {
    question: "¿Puedo imprimir sin internet?",
    answer:
      "No del todo. La app web necesita conexión, pero el agente local sí puede seguir comunicándose con tu impresora. Si la internet cae a mitad de un trabajo, el agente termina lo que estaba enviando.",
  },
  {
    question: "¿Los datos de mi planilla quedan en la nube?",
    answer:
      "Los datos se procesan en tu navegador y se guardan en nuestra base de datos segura (Supabase, región US). No compartimos tus datos con terceros. Podés leer nuestra política de privacidad.",
  },
  {
    question: "¿Puedo usar múltiples impresoras?",
    answer:
      "Sí. Podés registrar varias impresoras y elegir a cuál enviar cada trabajo. El plan Mensual permite 1 sucursal; el Pro 3; De por vida 5.",
  },
  {
    question: "¿Hay soporte si tengo problemas?",
    answer:
      "Sí. Podés escribirnos a inteliarstack.ia@gmail.com y respondemos en menos de 24 horas. El plan Pro y De por vida tiene soporte prioritario.",
  },
  {
    question: "¿Puedo cancelar en cualquier momento?",
    answer:
      "El plan Mensual se puede cancelar cuando quieras. El De por vida es un pago único sin renovaciones.",
  },
  {
    question: "¿Es una alternativa a BarTender?",
    answer:
      "Sí. Inteliar Labels hace lo mismo que BarTender para la mayoría de los casos de uso: diseñar plantillas, importar datos desde Excel o CSV e imprimir en impresoras térmicas ZPL y TSPL. La diferencia es que es más simple, 100% web y tiene un precio accesible desde US$10/mes.",
  },
  {
    question: "¿Funciona para imprimir etiquetas de precio, envío e inventario?",
    answer:
      "Sí, es ideal para los tres casos. Comercios usan Inteliar Labels para etiquetas de precio con código de barras. Empresas de logística lo usan para etiquetas de envío con QR. Depósitos y distribuidoras lo usan para control de inventario con SKU.",
  },
  {
    question: "¿Puedo imprimir códigos de barras y QR?",
    answer:
      "Sí. El diseñador visual incluye soporte nativo para códigos de barras (Code 128, EAN-13, EAN-8, Code 39) y códigos QR. Podés vincularlos a cualquier columna de tu planilla.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Todo lo que necesitás saber antes de empezar.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg divide-y divide-border">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={index}>
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-medium text-foreground">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
