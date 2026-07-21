"use client"

import Script from "next/script"

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
// Google Ads account conversion ID (etiqueta global). No es sensible — viaja
// al cliente igual que el GA_ID. Cuenta: inteliarstack.ia@gmail.com
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID
// Fragmento de evento de la acción de conversión "Registro"
export const GOOGLE_ADS_REGISTER_CONVERSION = GOOGLE_ADS_ID ? `${GOOGLE_ADS_ID}/f4eGCLe5-dMcEMDQqKZE` : undefined

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export function GoogleAnalytics() {
  const id = GA_ID || GOOGLE_ADS_ID
  if (!id) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_ID ? `gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: true
          });` : ""}
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
        `}
      </Script>
    </>
  )
}

// Helper para disparar eventos GA4 desde cualquier parte del código
export function gtagEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params)
  }
}

// Dispara una conversión de Google Ads (send_to: "AW-XXXX/label")
export function gtagAdsConversion(sendTo: string | undefined, params?: Record<string, any>) {
  if (!sendTo) return
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", { send_to: sendTo, ...params })
  }
}
