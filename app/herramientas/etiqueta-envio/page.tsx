"use client"

import { useState, useRef } from "react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Download, Package, RotateCcw } from "lucide-react"
import Link from "next/link"

interface ShipmentData {
  // Remitente
  remitenteNombre: string
  remitenteDireccion: string
  remitenteLocalidad: string
  remitenteProvincia: string
  remitenteCP: string
  remitenteTel: string
  // Destinatario
  destinatarioNombre: string
  destinatarioDireccion: string
  destinatarioLocalidad: string
  destinatarioProvincia: string
  destinatarioCP: string
  destinatarioTel: string
  // Envío
  fecha: string
  nroSeguimiento: string
  peso: string
  contenido: string
  notas: string
}

const empty: ShipmentData = {
  remitenteNombre: "", remitenteDireccion: "", remitenteLocalidad: "",
  remitenteProvincia: "", remitenteCP: "", remitenteTel: "",
  destinatarioNombre: "", destinatarioDireccion: "", destinatarioLocalidad: "",
  destinatarioProvincia: "", destinatarioCP: "", destinatarioTel: "",
  fecha: new Date().toLocaleDateString("es-AR"),
  nroSeguimiento: "", peso: "", contenido: "", notas: "",
}

function Input({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

function Barcode({ value }: { value: string }) {
  const pattern = (value || "000000000000").split("").flatMap((c) => {
    const n = c.charCodeAt(0) % 7
    return [n % 2 === 0 ? 3 : 1, n % 3 === 0 ? 2 : 1]
  })
  return (
    <div>
      <div className="flex gap-px items-end" style={{ height: 48 }}>
        {pattern.slice(0, 60).map((w, i) => (
          <div key={i} className="bg-black" style={{ width: w, height: i % 5 === 0 ? 48 : 32 }} />
        ))}
      </div>
      <div className="text-[9px] text-center mt-0.5 tracking-widest">{value || "000000000000"}</div>
    </div>
  )
}

function LabelPreview({ data }: { data: ShipmentData }) {
  return (
    <div
      id="label-preview"
      className="bg-white text-black w-full max-w-xl mx-auto"
      style={{ fontFamily: "Arial, sans-serif", border: "1px solid #ccc", padding: "32px 40px", minHeight: 320 }}
    >
      {/* Top row: remitente left | info + barcode right */}
      <div className="flex justify-between items-start mb-10">
        {/* Remitente */}
        <div style={{ fontSize: 11 }}>
          <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>DESDE:</div>
          <div>{data.remitenteNombre || "—"}</div>
          {data.remitenteDireccion && <div>{data.remitenteDireccion}</div>}
          <div>
            {[data.remitenteLocalidad, data.remitenteProvincia, data.remitenteCP].filter(Boolean).join(", ")}
          </div>
          {data.remitenteTel && <div>Tel: {data.remitenteTel}</div>}
        </div>

        {/* Info + barcode */}
        <div className="text-right" style={{ fontSize: 11 }}>
          {data.fecha && (
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              FECHA DE ENVÍO: {data.fecha}
            </div>
          )}
          {data.peso && (
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              PESO: {data.peso.toUpperCase()}
            </div>
          )}
          {data.nroSeguimiento && (
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              NÚM. SEGUIMIENTO: {data.nroSeguimiento.toUpperCase()}
            </div>
          )}
          {data.nroSeguimiento && (
            <div className="flex justify-end">
              <Barcode value={data.nroSeguimiento} />
            </div>
          )}
        </div>
      </div>

      {/* Destinatario — large, centered */}
      <div className="text-center" style={{ fontSize: 22, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 400 }}>
          <span style={{ fontWeight: 700 }}>Para:</span>{data.destinatarioNombre || "—"}
        </div>
        {data.destinatarioDireccion && <div>{data.destinatarioDireccion}</div>}
        <div>
          {[data.destinatarioLocalidad, data.destinatarioProvincia, data.destinatarioCP].filter(Boolean).join(", ")}
        </div>
        {data.destinatarioTel && <div style={{ fontSize: 16 }}>Tel: {data.destinatarioTel}</div>}
      </div>

      {/* Extras */}
      {(data.contenido || data.notas) && (
        <div style={{ borderTop: "1px solid #ccc", marginTop: 20, paddingTop: 10, fontSize: 10 }}>
          {data.contenido && <div><strong>Contenido:</strong> {data.contenido}</div>}
          {data.notas && <div><strong>Notas:</strong> {data.notas}</div>}
        </div>
      )}
    </div>
  )
}

export default function EtiquetaEnvioPage() {
  const [data, setData] = useState<ShipmentData>(empty)
  const [generated, setGenerated] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const set = (key: keyof ShipmentData) => (v: string) => setData((d) => ({ ...d, [key]: v }))

  const handlePrint = () => {
    const el = document.getElementById("label-preview")
    if (!el) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Etiqueta de Envío</title>
      <style>
        body { margin: 20px; font-family: monospace; }
        @media print { body { margin: 0; } }
      </style>
      </head><body>${el.outerHTML}
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `)
    win.document.close()
  }

  const hasMinData = data.remitenteNombre && data.destinatarioNombre && data.destinatarioDireccion

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-12 px-4 sm:px-6 border-b border-border">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Package className="w-4 h-4" />
              Herramienta gratuita
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Generador de etiquetas de envío gratis
            </h1>
            <p className="text-lg text-muted-foreground">
              Completá los datos del remitente y destinatario y generá tu etiqueta de envío al instante.
              Sin registrarte, sin costo. Lista para imprimir.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">
            {/* Formulario */}
            <div className="space-y-8">
              {/* Remitente */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
                  Datos del remitente (quien envía)
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input label="Nombre completo o empresa" value={data.remitenteNombre} onChange={set("remitenteNombre")} placeholder="Ej: Juan Pérez / Mi Empresa SRL" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Dirección" value={data.remitenteDireccion} onChange={set("remitenteDireccion")} placeholder="Calle 123, Piso 2" />
                  </div>
                  <Input label="Localidad / Ciudad" value={data.remitenteLocalidad} onChange={set("remitenteLocalidad")} placeholder="Buenos Aires" />
                  <Input label="Provincia" value={data.remitenteProvincia} onChange={set("remitenteProvincia")} placeholder="CABA" />
                  <Input label="Código postal" value={data.remitenteCP} onChange={set("remitenteCP")} placeholder="1414" />
                  <Input label="Teléfono (opcional)" value={data.remitenteTel} onChange={set("remitenteTel")} placeholder="11 1234-5678" />
                </div>
              </div>

              {/* Destinatario */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
                  Datos del destinatario (quien recibe)
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input label="Nombre completo o empresa" value={data.destinatarioNombre} onChange={set("destinatarioNombre")} placeholder="Ej: María García" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Dirección" value={data.destinatarioDireccion} onChange={set("destinatarioDireccion")} placeholder="Av. Corrientes 1234" />
                  </div>
                  <Input label="Localidad / Ciudad" value={data.destinatarioLocalidad} onChange={set("destinatarioLocalidad")} placeholder="Rosario" />
                  <Input label="Provincia" value={data.destinatarioProvincia} onChange={set("destinatarioProvincia")} placeholder="Santa Fe" />
                  <Input label="Código postal" value={data.destinatarioCP} onChange={set("destinatarioCP")} placeholder="2000" />
                  <Input label="Teléfono (opcional)" value={data.destinatarioTel} onChange={set("destinatarioTel")} placeholder="341 1234-5678" />
                </div>
              </div>

              {/* Info envío */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
                  Información del envío
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Fecha de envío" value={data.fecha} onChange={set("fecha")} placeholder="30/06/2026" />
                  <Input label="N° de seguimiento (opcional)" value={data.nroSeguimiento} onChange={set("nroSeguimiento")} placeholder="AR123456789" />
                  <Input label="Peso del paquete (opcional)" value={data.peso} onChange={set("peso")} placeholder="1.5 kg" />
                  <Input label="Contenido (opcional)" value={data.contenido} onChange={set("contenido")} placeholder="Ropa, electrónica..." />
                  <div className="sm:col-span-2">
                    <Input label="Notas adicionales (opcional)" value={data.notas} onChange={set("notas")} placeholder="Frágil, no apilar..." />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => setGenerated(true)}
                  disabled={!hasMinData}
                >
                  <Package className="w-4 h-4" />
                  Generar etiqueta
                </Button>
                <Button variant="outline" onClick={() => { setData(empty); setGenerated(false) }}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {!hasMinData && (
                <p className="text-xs text-muted-foreground -mt-2">
                  Completá al menos el nombre del remitente, y nombre + dirección del destinatario.
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground">Vista previa</h2>

              <div ref={printRef} className={`transition-opacity ${generated ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                <LabelPreview data={data} />
              </div>

              {generated && (
                <div className="space-y-3">
                  <Button className="w-full gap-2" onClick={handlePrint}>
                    <Download className="w-4 h-4" />
                    Imprimir / Guardar como PDF
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    En el diálogo de impresión elegí "Guardar como PDF" para descargarla.
                  </p>
                </div>
              )}

              {/* CTA Inteliar */}
              {generated && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mt-4">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    ¿Tenés que imprimir etiquetas de precio o producto?
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Con Inteliar Labels importás tu lista de productos desde Excel o Tiendanube
                    y las imprimís en segundos en tu impresora térmica Zebra, TSC o Godex.
                  </p>
                  <Link href="/auth/register">
                    <Button size="sm" className="gap-2 w-full group">
                      Probarlo gratis — 15 días
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEO content */}
        <section className="py-12 px-4 sm:px-6 border-t border-border bg-muted/20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">Preguntas frecuentes</h2>
            <div className="space-y-5">
              {[
                {
                  q: "¿Esta es una etiqueta de envío oficial de una empresa de transporte?",
                  a: "No. Esta es una plantilla de organización que incluye los datos del remitente, destinatario y el paquete. Para enviar un paquete con Correo Argentino, OCA, Andreani u otra empresa, igualmente necesitás comprar el servicio de envío en sus respectivos sitios. Esta etiqueta puede servir como referencia o para uso interno."
                },
                {
                  q: "¿Cómo imprimo la etiqueta?",
                  a: "Hacé click en 'Imprimir / Guardar como PDF'. Se abre el diálogo de impresión del navegador. Podés imprimirla directamente o elegir 'Guardar como PDF' para descargarla."
                },
                {
                  q: "¿Necesito crear una cuenta?",
                  a: "No. La herramienta es completamente gratuita y no requiere registro."
                },
                {
                  q: "¿Para qué sirve el número de seguimiento?",
                  a: "Es el número que te da la empresa de transporte cuando contratás el envío. Podés dejarlo en blanco si todavía no lo tenés, o completarlo después."
                },
                {
                  q: "¿Puedo usar esta etiqueta para envíos de mi negocio?",
                  a: "Sí, podés usarla como etiqueta de identificación para paquetes, como referencia interna o para organizar tus envíos. Para etiquetas de precio y producto con impresora térmica, probá Inteliar Labels."
                },
              ].map((faq, i) => (
                <div key={i} className="border border-border rounded-xl p-4">
                  <p className="font-medium text-foreground mb-1">{faq.q}</p>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
