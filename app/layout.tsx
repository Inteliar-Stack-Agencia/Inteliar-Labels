import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@/components/google-analytics'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://etiquetar.app'),
  verification: {
    google: 'nemBe9x4IsZm82Op4LTeiMRz8HDCdYi6mu3FrrlBr_M',
  },
  title: 'Inteliar Labels — Software para imprimir etiquetas térmicas desde Excel',
  description: 'Imprimí etiquetas térmicas desde Excel o CSV en segundos. Compatible con Zebra, TSC, Honeywell, Godex y Brother. Diseñador visual con IA, códigos de barras y QR. Trial 15 días gratis, sin tarjeta.',
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
  ],
  authors: [{ name: 'Inteliar Stack', url: 'https://etiquetar.app' }],
  creator: 'Inteliar Stack',
  publisher: 'Inteliar Stack',
  openGraph: {
    title: 'Inteliar Labels — Imprimí etiquetas térmicas desde Excel',
    description: 'Subí tu planilla, elegí un template e imprimí al instante. Sin BarTender, sin vueltas. Trial gratis 15 días.',
    type: 'website',
    locale: 'es_AR',
    url: 'https://etiquetar.app',
    siteName: 'Inteliar Labels',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inteliar Labels — Etiquetas térmicas desde Excel en segundos',
    description: 'Sin BarTender. Sin curva de aprendizaje. Trial 15 días gratis.',
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
    "description": "Software SaaS para imprimir etiquetas térmicas desde Excel o CSV. Soporte para impresoras Zebra, TSC, Honeywell y Brother. Diseñador visual con IA.",
    "offers": [
      {
        "@type": "Offer",
        "name": "Plan Mensual",
        "price": "10",
        "priceCurrency": "USD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "10",
          "priceCurrency": "USD",
          "unitCode": "MON"
        }
      },
      {
        "@type": "Offer",
        "name": "Plan Pro",
        "price": "19",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "name": "Plan De por vida",
        "price": "300",
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
    <html lang="es" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
