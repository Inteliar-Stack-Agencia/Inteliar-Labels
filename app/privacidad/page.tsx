import Link from "next/link"

export const metadata = {
  title: "Política de Privacidad | Inteliar Labels",
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Volver al inicio
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-gray-500 mb-2">Última actualización: 28 de junio de 2026</p>
          <p className="text-sm text-gray-500 mb-8">
            Esta política cumple con la Ley 25.326 de Protección de los Datos Personales de la República
            Argentina y su Decreto Reglamentario 1558/2001.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Datos que recopilamos</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Datos de cuenta:</strong> dirección de correo electrónico y contraseña (almacenada
                en formato cifrado) al momento del registro.
              </li>
              <li>
                <strong>Datos de uso:</strong> plantillas creadas, cantidad de impresiones realizadas,
                fecha de registro y último acceso.
              </li>
              <li>
                <strong>Datos de pago:</strong> no almacenamos datos de tarjetas de crédito. Las
                transacciones son procesadas íntegramente por MercadoPago o Stripe según el método elegido.
              </li>
              <li>
                <strong>Datos técnicos:</strong> dirección IP, tipo de navegador y sistema operativo,
                recopilados automáticamente con fines de seguridad y diagnóstico.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Cómo usamos tus datos</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Proveer y mejorar el Servicio.</li>
              <li>Enviar correos transaccionales (bienvenida, licencia, aviso de vencimiento de trial).</li>
              <li>Gestionar el cobro y la facturación de suscripciones.</li>
              <li>Detectar y prevenir fraudes o usos abusivos.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
            <p className="text-gray-600 mt-3 leading-relaxed">
              No vendemos ni cedemos tus datos personales a terceros con fines comerciales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Terceros que acceden a tus datos</h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Para operar el Servicio utilizamos los siguientes proveedores de confianza, cada uno con sus
              propias políticas de privacidad:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Proveedor</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Finalidad</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Datos compartidos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">Supabase</td>
                    <td className="p-3 border border-gray-200">Base de datos y autenticación</td>
                    <td className="p-3 border border-gray-200">Email, datos de cuenta y uso</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Resend</td>
                    <td className="p-3 border border-gray-200">Envío de correos transaccionales</td>
                    <td className="p-3 border border-gray-200">Dirección de email</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">MercadoPago / Stripe</td>
                    <td className="p-3 border border-gray-200">Procesamiento de pagos</td>
                    <td className="p-3 border border-gray-200">Email, datos de pago (gestionados por ellos)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Derechos del titular de los datos</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              De acuerdo con la Ley 25.326, tenés derecho a:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li><strong>Acceder</strong> a los datos personales que tenemos sobre vos.</li>
              <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
              <li><strong>Suprimir</strong> tus datos cuando no sean necesarios para la finalidad para la que fueron recabados.</li>
              <li><strong>Oponerte</strong> al tratamiento de tus datos en ciertos supuestos.</li>
            </ul>
            <p className="text-gray-600 mt-3 leading-relaxed">
              Para ejercer cualquiera de estos derechos, escribinos a{" "}
              <a href="mailto:inteliarstack.ia@gmail.com" className="text-blue-600 hover:underline">
                inteliarstack.ia@gmail.com
              </a>{" "}
              indicando tu solicitud. Responderemos en un plazo máximo de 5 días hábiles.
            </p>
            <p className="text-gray-600 mt-2 leading-relaxed text-sm">
              La Dirección Nacional de Protección de Datos Personales (DNPDP) es el órgano de control
              competente en la materia.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Retención de datos</h2>
            <p className="text-gray-600 leading-relaxed">
              Conservamos tus datos mientras tu cuenta esté activa o según sea necesario para cumplir
              obligaciones legales. Al solicitar la eliminación de tu cuenta, tus datos personales serán
              suprimidos en un plazo máximo de 30 días, excepto aquellos que debamos conservar por
              obligación legal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Para consultas sobre esta Política de Privacidad o el tratamiento de tus datos personales,
              contactanos en{" "}
              <a href="mailto:inteliarstack.ia@gmail.com" className="text-blue-600 hover:underline">
                inteliarstack.ia@gmail.com
              </a>
              .
            </p>
          </section>
        </article>

        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
          <Link href="/terminos" className="hover:text-blue-600 hover:underline">
            Términos y Condiciones
          </Link>
          <Link href="/" className="hover:text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
