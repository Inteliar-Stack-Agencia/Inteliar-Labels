import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Inteliar Labels — Imprimí 100+ etiquetas en segundos desde Excel',
  description: 'La forma más rápida de imprimir etiquetas térmicas desde Excel o CSV. Templates con variables, diseñador visual con IA, soporte Zebra/TSC/Honeywell. Trial 15 días gratis, sin tarjeta.',
  keywords: ['etiquetas termicas', 'impresora zebra', 'ZPL', 'TSPL', 'etiquetas desde excel', 'bartender alternativa', 'software etiquetas'],
  openGraph: {
    title: 'Inteliar Labels — Imprimí etiquetas térmicas desde Excel',
    description: 'Subí tu planilla, elegí un template e imprimí al instante. Sin BarTender, sin vueltas. Trial gratis 15 días.',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inteliar Labels — Etiquetas térmicas desde Excel en segundos',
    description: 'Sin BarTender. Sin curva de aprendizaje. Trial 15 días gratis.',
  },
  generator: 'v0.app',
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
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
