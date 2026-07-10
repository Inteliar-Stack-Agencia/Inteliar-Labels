// CSP allows 'unsafe-inline' for scripts because Google Analytics is
// injected as an inline <script> (components/google-analytics.tsx) without
// a nonce. Tightening this further would require wiring a per-request nonce
// through middleware — left as a follow-up, not done here to avoid breaking
// analytics silently.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // http://localhost:* / 127.0.0.1:* let the dashboard talk to the local
  // Inteliar Printer Agent (default port 9638, user-configurable) running
  // on the customer's own machine — without this, the browser silently
  // blocks the fetch and the agent looks "offline" even when it's running.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://vitals.vercel-insights.com https://api.mercadopago.com https://open.er-api.com http://localhost:* http://127.0.0.1:*",
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
