/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Requerido para Cloudflare Pages
  experimental: {
    runtime: "edge",
  },
}

export default nextConfig
