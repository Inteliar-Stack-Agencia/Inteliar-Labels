import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@/components/google-analytics'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://etiquetar.app'),
  verification: {
    google: 'nemBe9x4IsZm82Op4LTeiMRz8HDCdYi6mu3FrrlBr_M',
  },
  title: 'Inteliar Labels — Etiquetas térmicas desde Mercado Libre, Tiendanube o Excel',
  description: 'Conectá Mercado Libre y Tiendanube o subí tu Excel/CSV, e imprimí etiquetas térmicas en segundos — incluida la etiqueta oficial de Mercado Envíos. Compatible con Zebra, TSC, Honeywell, Godex y Brother. Diseñador visual con IA. Trial 15 días gratis, sin tarjeta.',
  keywords: [
    'etiquetas termicas', 'impresora zebra', 'ZPL', 'TSPL',
    'etiquetas desde excel', 'bartender alternativa', 'software etiquetas',
    'impresion etiquetas', 'etiquetas de precio', 'etiquetas zebra argentina',
    'programa para imprimir etiquetas', 'software etiquetas termicas',
    'imprimir etiquetas desde excel', 'etiquetas TSC', 'etiquetas Honeywell',
    'etiquetas Godex', 'etiquetas Brother', 'etiquetas Bixolon',
    'etiquetas codigo de barras', 'etiquetas QR', 'etiquetas precio supermercado',
    'etiquetas logistica', 'etiquetas inventario', 'etiquetas envio',
    'etiquetas producto', 'diseñador etiquetas online', 'etiquetas termicas argentina',
    'etiquetas termicas mexico', 'alternativa bartender gratis',
    'software etiquetas windows', 'imprimir etiquetas csv',
    'etiquetas mercado libre', 'imprimir etiqueta mercado envios',
    'etiqueta envio mercado libre', 'integracion mercado libre etiquetas',
    'etiquetas tiendanube', 'imprimir etiquetas tiendanube',
    'integracion tiendanube etiquetas', 'etiquetas pedidos tiendanube',
    'etiquetas shopify', 'imprimir etiquetas shopify', 'integracion shopify etiquetas',
    'etiquetas correo argentino', 'etiqueta correo argentino', 'rotulo correo argentino',
    'etiquetas pickit', 'imprimir etiqueta pickit',
    'etiquetas andreani', 'imprimir etiqueta andreani',
    'etiquetas via cargo', 'via cargo etiquetas',
    'punto hop', 'etiquetas punto hop',
    'etiquetas oca', 'imprimir etiqueta oca',
    'etiquetas encomiendas', 'imprimir etiquetas encomiendas',
    'etiquetas paquetes', 'imprimir etiquetas paquetes',
    'etiqueta envio paquete', 'software etiquetas envios argentina',
    // Otros marketplaces / e-commerce
    'etiquetas amazon', 'imprimir etiquetas amazon fba', 'etiquetas ebay',
    'etiquetas woocommerce', 'etiquetas prestashop', 'etiquetas magento',
    'etiquetas vtex', 'etiquetas falabella', 'etiquetas empretienda',
    // Otros correos / transportistas LatAm
    'etiquetas moova', 'etiquetas enviopack', 'etiquetas skydropx',
    'etiquetas oca express', 'etiquetas correos chile', 'etiquetas estafeta',
    'etiquetas 99minutos', 'etiquetas rappi envios', 'micorreo etiquetas',
    'paq.ar etiquetas', 'rotulador correo argentino', 'etiqueta envio nube',
    // Otras marcas de impresoras
    'etiquetas argox', 'etiquetas datamax', 'etiquetas intermec',
    'etiquetas epson', 'etiquetas elgin', 'etiquetas bematech',
    'etiquetas citizen', 'etiquetas sato', 'etiquetas tsc ttp',
    'impresora etiquetas termica directa', 'impresora transferencia termica',
    // Términos genéricos de categoría
    'etiquetadora', 'impresora de etiquetas', 'rollo de etiquetas',
    'etiquetas autoadhesivas', 'etiquetas codigo ean', 'gestor de etiquetas',
    'sistema de etiquetado', 'etiquetas para deposito', 'etiquetas wms',
    'etiquetas para ecommerce', 'imprimir etiquetas masivo', 'etiquetas en lote',
    'plantillas de etiquetas', 'editor de etiquetas online', 'crear etiquetas con ia',
    'software para picking', 'etiquetas control de stock',
    // Verticales de negocio
    'etiquetas farmacia', 'etiquetas ferreteria', 'etiquetas dietetica',
    'etiquetas indumentaria', 'etiquetas logistica ecommerce', 'etiquetas mayoristas',
  ],
  authors: [{ name: 'Inteliar Stack', url: 'https://etiquetar.app' }],
  creator: 'Inteliar Stack',
  publisher: 'Inteliar Stack',
  openGraph: {
    title: 'Inteliar Labels — Etiquetas desde Mercado Libre, Tiendanube o Excel',
    description: 'Conectá tu cuenta e imprimí al instante — incluida la etiqueta oficial de Mercado Envíos. Sin BarTender, sin vueltas. Trial gratis 15 días.',
    type: 'website',
    locale: 'es_AR',
    url: 'https://etiquetar.app',
    siteName: 'Inteliar Labels',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Inteliar Labels — Conectá Mercado Libre y Tiendanube, imprimí tus etiquetas en segundos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inteliar Labels — Etiquetas de Mercado Libre y Tiendanube en segundos',
    description: 'Sin BarTender. Sin curva de aprendizaje. Trial 15 días gratis.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Inteliar Labels",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Windows",
    "url": "https://etiquetar.app",
    "description": "Software SaaS para imprimir etiquetas térmicas. Integraciones con Mercado Libre (incluida la etiqueta oficial de Mercado Envíos) y Tiendanube, o importación desde Excel/CSV. Soporte para impresoras Zebra, TSC, Honeywell y Brother. Diseñador visual con IA.",
    "offers": [
      {
        "@type": "Offer",
        "name": "Plan Mensual",
        "price": "12",
        "priceCurrency": "USD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "12",
          "priceCurrency": "USD",
          "unitCode": "MON"
        }
      },
      {
        "@type": "Offer",
        "name": "Plan Pro",
        "price": "25",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "name": "Plan Pro · 5 años",
        "price": "800",
        "priceCurrency": "USD"
      }
    ],
    "author": {
      "@type": "Organization",
      "name": "Inteliar Stack",
      "email": "inteliarstack.ia@gmail.com",
      "url": "https://etiquetar.app"
    },
    "featureList": [
      "Diseñador visual de plantillas",
      "Asistente de IA para crear plantillas",
      "Integración con Mercado Libre (etiqueta oficial de Mercado Envíos)",
      "Integración con Tiendanube (pedidos y catálogo)",
      "Importación desde Excel y CSV",
      "Soporte Zebra ZPL, TSC TSPL, Honeywell, Brother",
      "Trial gratuito 15 días"
    ],
    "screenshot": "https://etiquetar.app/og-image.png",
    "softwareVersion": "1.0",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    }
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Analytics />
          <GoogleAnalytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
