import Link from "next/link"

export const metadata = {
  title: "Términos y Condiciones | Inteliar Labels",
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Volver al inicio
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: 28 de julio de 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Objeto del servicio</h2>
            <p className="text-gray-600 leading-relaxed">
              Inteliar Labels (en adelante "el Servicio") es una plataforma SaaS que permite a usuarios
              registrados diseñar plantillas de etiquetas, cargar datos desde archivos Excel y enviar
              trabajos de impresión a impresoras térmicas o de etiquetas conectadas a través de un agente
              local instalado en Windows. El Servicio es provisto por Inteliar Stack
              (inteliarstack.ia@gmail.com).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Planes y pagos</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              El Servicio ofrece distintos planes de suscripción detallados en la sección de precios del
              sitio. Los precios se expresan en la moneda indicada en la página de precios y pueden variar
              según la región.
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Los pagos se procesan a través de plataformas de pago externas (MercadoPago o Stripe).</li>
              <li>Las suscripciones mensuales se renuevan automáticamente salvo que el usuario las cancele.</li>
              <li>No se realizan reembolsos por períodos ya facturados salvo disposición legal en contrario.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Trial gratuito</h2>
            <p className="text-gray-600 leading-relaxed">
              Al registrarse, cada usuario accede a un período de prueba gratuita de <strong>15 días
              corridos</strong> con un límite de <strong>500 impresiones</strong>. El trial expira al
              cumplirse el primer límite que se alcance (tiempo o impresiones). Una vez vencido el trial,
              el acceso a las funciones de impresión quedará restringido hasta que el usuario contrate un
              plan pago. No se requiere tarjeta de crédito para iniciar el trial.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Cancelación</h2>
            <p className="text-gray-600 leading-relaxed">
              El usuario puede cancelar su suscripción en cualquier momento desde la configuración de su
              cuenta. La cancelación tiene efecto al finalizar el período ya abonado. Inteliar Stack se
              reserva el derecho de suspender o cancelar cuentas que incumplan estos términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Límites de uso según plan</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Cada plan tiene límites definidos en la página de precios (cantidad de sucursales/dispositivos,
              cantidad de impresoras por dispositivo, e impresiones mensuales, según corresponda). Estos
              límites forman parte del contrato y pueden aplicarse técnicamente por el Servicio. Si tu uso
              supera el límite de tu plan, vas a necesitar actualizar a un plan superior para continuar
              usando el Servicio sin restricciones.
            </p>
            <p className="text-gray-600 leading-relaxed">
              No está permitido compartir credenciales de cuenta ni de licencia entre distintos usuarios o
              negocios con el fin de eludir los límites de dispositivos o impresoras de tu plan, ni realizar
              ingeniería inversa del software o los agentes de impresión provistos por el Servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Propiedad intelectual</h2>
            <p className="text-gray-600 leading-relaxed">
              Todo el software, diseño, código fuente y documentación del Servicio son propiedad exclusiva
              de Inteliar Stack. El usuario recibe una licencia de uso limitada, no exclusiva e
              intransferible para acceder al Servicio durante la vigencia de su suscripción. Los datos y
              plantillas creados por el usuario son de su propiedad; Inteliar Stack no reclama derechos
              sobre ellos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Limitación de responsabilidad</h2>
            <p className="text-gray-600 leading-relaxed">
              El Servicio se provee "tal como está". Inteliar Stack no garantiza disponibilidad
              ininterrumpida ni ausencia de errores. En ningún caso la responsabilidad total de Inteliar
              Stack hacia el usuario superará el monto abonado por el usuario en los últimos 3 meses. No
              somos responsables por pérdidas de datos, lucro cesante ni daños indirectos derivados del
              uso del Servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Ley aplicable y jurisdicción</h2>
            <p className="text-gray-600 leading-relaxed">
              Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Cualquier
              controversia derivada del uso del Servicio será sometida a los tribunales ordinarios
              competentes de la Ciudad Autónoma de Buenos Aires, con renuncia expresa a cualquier otro fuero
              o jurisdicción que pudiera corresponder.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Para consultas sobre estos Términos y Condiciones podés escribirnos a{" "}
              <a href="mailto:inteliarstack.ia@gmail.com" className="text-blue-600 hover:underline">
                inteliarstack.ia@gmail.com
              </a>
              .
            </p>
          </section>
        </article>

        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
          <Link href="/privacidad" className="hover:text-blue-600 hover:underline">
            Política de Privacidad
          </Link>
          <Link href="/" className="hover:text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
