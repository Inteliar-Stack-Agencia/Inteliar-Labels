import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/settings", "/admin", "/api/"],
      },
    ],
    sitemap: "https://etiquetar.app/sitemap.xml",
    host: "https://etiquetar.app",
  }
}
