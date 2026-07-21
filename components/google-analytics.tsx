"use client"

import Script from "next/script"

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
// Google Ads account conversion ID (etiqueta global). No es sensible — viaja
// al cliente igual que el GA_ID. Cuenta: inteliarstack.ia@gmail.com
const GOOGLE_ADS_ID = "AW-18333968448"
// Fragmento de evento de la acción de conversión "Registro"
export const GOOGLE_ADS_REGISTER_CONVERSION = "AW-18333968448/f4eGCLe5-dMcEMDQqKZE"

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
          gtag('config', '${GOOGLE_ADS_ID}');
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
export function gtagAdsConversion(sendTo: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", { send_to: sendTo, ...params })
  }
}
