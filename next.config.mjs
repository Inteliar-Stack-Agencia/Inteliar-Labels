// CSP allows 'unsafe-inline' for scripts because Google Analytics is
// injected as an inline <script> (components/google-analytics.tsx) without
// a nonce. Tightening this further would require wiring a per-request nonce
// through middleware — left as a follow-up, not done here to avoid breaking
// analytics silently.
const csp = [
  "default-src 'self'",
  // Google Ads conversion tracking / remarketing tags load from
  // googleadservices.com and googletagmanager loads a doubleclick script
  // for view-through conversions — both required for Ads campaigns to track.
  // connect.facebook.net serves the Meta Pixel's fbevents.js script.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // http://localhost:* / 127.0.0.1:* let the dashboard talk to the local
  // Inteliar Printer Agent (default port 9638, user-configurable) running
  // on the customer's own machine — without this, the browser silently
  // blocks the fetch and the agent looks "offline" even when it's running.
  // ad.doubleclick.net / www.google.com (ccm/collect, rmkt/collect) and
  // googleads.g.doubleclick.net are the Google Ads conversion + remarketing
  // beacons fired by gtag.js when a Google Ads account is linked to GA4.
  // www.facebook.com / connect.facebook.net are the Meta Pixel's tracking
  // beacons (fbq 'track' calls and the noscript <img> fallback).
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://vitals.vercel-insights.com https://api.mercadopago.com https://open.er-api.com https://ad.doubleclick.net https://www.google.com https://googleads.g.doubleclick.net https://www.facebook.com https://connect.facebook.net http://localhost:* http://127.0.0.1:*",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ")

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ]
  },
}

export default nextConfig
