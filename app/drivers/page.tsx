import Link from "next/link"
import { DRIVER_CATALOG, SEAGULL_DRIVERS_URL } from "@/lib/printer-drivers"

export const metadata = {
  title: "Drivers de impresoras | Inteliar Labels",
  description:
    "Enlaces oficiales para descargar el driver de tu impresora de etiquetas: Honeywell, Zebra, TSC, Citizen, Sato y Bixolon.",
}

export default function DriversPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Volver al inicio
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Drivers de impresoras</h1>
        <p className="text-gray-600 mb-8">
          Para que tu impresora de etiquetas aparezca en Inteliar Labels, Windows tiene que reconocerla
          primero. Eso lo hace el <strong>driver</strong> del fabricante. Buscá tu marca abajo, descargá
          el driver e instalalo con la impresora conectada y encendida.
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-8">
          <p className="text-sm text-amber-900">
            <strong>¿Por qué enlaces y no descarga directa?</strong> Los drivers son software de cada
            fabricante y se actualizan seguido. Te mandamos a la página oficial para que bajes siempre
            la versión vigente y firmada por el fabricante, sin intermediarios.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {DRIVER_CATALOG.map((d) => (
            <div key={d.brand} className="rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-lg font-semibold text-gray-900">{d.label}</h2>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Descargar driver
                </a>
              </div>
              <p className="text-sm text-gray-600">
                Modelos frecuentes: {d.models.join(", ")}
              </p>
              {d.note && <p className="mt-1 text-sm text-gray-500">{d.note}</p>}
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            ¿No encontrás tu modelo?
          </h2>
          <p className="text-gray-600 mb-3">
            Seagull publica drivers para prácticamente todas las marcas de impresoras de etiquetas,
            incluso modelos viejos que el fabricante ya no soporta. Es la mejor opción de respaldo.
          </p>
          <a
            href={SEAGULL_DRIVERS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Ver drivers de Seagull →
          </a>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Después de instalar el driver</h2>
          <ol className="list-decimal pl-6 text-gray-600 space-y-2">
            <li>
              Verificá que la impresora aparezca en Windows: <strong>Configuración → Bluetooth y
              dispositivos → Impresoras y escáneres</strong>.
            </li>
            <li>
              Probá <strong>Imprimir página de prueba</strong> desde ahí. Si eso no sale, el problema es
              del driver o del cable, todavía no de Inteliar Labels.
            </li>
            <li>
              Abrí el agente de impresión de Inteliar Labels en esa misma computadora.
            </li>
            <li>
              Entrá a <strong>Configuración → Impresoras</strong>, agregá una impresora con conexión USB
              y elegila de la lista que se detecta sola.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Problemas frecuentes</h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <p className="font-medium text-gray-800">La impresora dice &quot;Sin conexión&quot; o &quot;Error&quot;</p>
              <p className="text-sm">
                Revisá que esté encendida, que el cable USB esté firme en ambas puntas (mejor un puerto
                directo, no un hub) y que tenga etiquetas cargadas con la tapa bien cerrada. Muchas
                impresoras marcan error si detectan falta de papel.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Instalé el driver pero no aparece en la lista</p>
              <p className="text-sm">
                Cerrá y volvé a abrir el agente de impresión, después tocá &quot;Volver a buscar&quot; en
                Configuración → Impresoras. Si sigue sin aparecer, reiniciá la cola de impresión de
                Windows: Win+R → <code className="rounded bg-gray-100 px-1">services.msc</code> → Cola de
                impresión → Reiniciar.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Tengo dos impresoras del mismo modelo</p>
              <p className="text-sm">
                Ponele a cada una un nombre distinto en Windows (por ejemplo &quot;PC42t - Depósito&quot; y
                &quot;PC42t - Local&quot;) para poder diferenciarlas al momento de imprimir.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
