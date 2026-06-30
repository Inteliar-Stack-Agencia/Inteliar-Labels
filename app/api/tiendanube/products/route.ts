import { NextRequest, NextResponse } from "next/server"

// Extracts store ID from a Tiendanube URL like:
//   mitienda.mitiendanube.com
//   https://mitienda.mitiendanube.com
//   mitienda.tiendanube.com (AR short domain)
function extractStoreSlug(input: string): string {
  try {
    const url = input.startsWith("http") ? new URL(input) : new URL(`https://${input}`)
    return url.hostname.split(".")[0]
  } catch {
    return input.trim()
  }
}

interface TNProduct {
  id: number
  name: Record<string, string>
  variants: TNVariant[]
  categories: { name: Record<string, string> }[]
}

interface TNVariant {
  id: number
  sku: string | null
  price: string
  compare_at_price: string | null
  barcode: string | null
  values: { name: Record<string, string>; description: Record<string, string> }[]
}

async function fetchAllProducts(storeId: string, token?: string): Promise<TNProduct[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "InteliarLabels/1.0 (soporte@inteliarstack.com)",
  }
  if (token) headers["Authentication"] = `bearer ${token}`

  const products: TNProduct[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const res = await fetch(
      `https://api.tiendanube.com/v1/${storeId}/products?page=${page}&per_page=${perPage}&fields=id,name,variants,categories`,
      { headers, next: { revalidate: 0 } }
    )

    if (res.status === 401 || res.status === 403) {
      throw new Error("La tienda es privada o requiere autenticación.")
    }
    if (!res.ok) {
      throw new Error(`Error al obtener productos de Tiendanube (${res.status}).`)
    }

    const batch: TNProduct[] = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    products.push(...batch)
    if (batch.length < perPage) break
    page++
  }

  return products
}

function normalizeProducts(products: TNProduct[]) {
  const rows: Record<string, string>[] = []

  for (const product of products) {
    const name = product.name?.es || product.name?.pt || Object.values(product.name ?? {})[0] || ""
    const category =
      product.categories?.[0]?.name?.es ||
      product.categories?.[0]?.name?.pt ||
      Object.values(product.categories?.[0]?.name ?? {})[0] ||
      ""

    for (const variant of product.variants ?? []) {
      const variantOptions = (variant.values ?? [])
        .map((v) => v.description?.es || v.description?.pt || Object.values(v.description ?? {})[0] || "")
        .filter(Boolean)
        .join(" / ")

      const fullName = variantOptions ? `${name} — ${variantOptions}` : name

      rows.push({
        nombre: fullName,
        precio: variant.price ?? "",
        precio_anterior: variant.compare_at_price ?? "",
        sku: variant.sku ?? "",
        codigo_barras: variant.barcode ?? "",
        categoria: category,
        cantidad: "1",
      })
    }
  }

  return rows
}

export async function POST(req: NextRequest) {
  const { storeUrl, token } = await req.json()

  if (!storeUrl) {
    return NextResponse.json({ error: "URL de la tienda requerida." }, { status: 400 })
  }

  const slug = extractStoreSlug(storeUrl)

  // Tiendanube public API requires a numeric store ID.
  // We resolve it by fetching the store info page and extracting the ID.
  // Alternative: user can paste their store ID directly.
  // If slug is already numeric, use it directly.
  let storeId = slug
  if (!/^\d+$/.test(slug)) {
    // Try to resolve via store domain
    const metaRes = await fetch(`https://${slug}.mitiendanube.com/`, {
      headers: { "User-Agent": "InteliarLabels/1.0" },
    }).catch(() => null)

    if (metaRes?.ok) {
      const html = await metaRes.text()
      const match = html.match(/"store_id"\s*:\s*"?(\d+)"?/) ||
                    html.match(/tiendanube\.com\/v1\/(\d+)/) ||
                    html.match(/store[_-]id['":\s]+(\d+)/i)
      if (match) storeId = match[1]
    }

    if (!/^\d+$/.test(storeId)) {
      return NextResponse.json({
        error: "No pudimos obtener el ID de tu tienda automáticamente. Pegá el ID numérico de tu tienda Tiendanube (lo encontrás en Configuración → Datos de la tienda).",
        needsId: true,
      }, { status: 422 })
    }
  }

  try {
    const products = await fetchAllProducts(storeId, token)

    if (products.length === 0) {
      return NextResponse.json({ error: "La tienda no tiene productos publicados." }, { status: 404 })
    }

    const rows = normalizeProducts(products)
    const columns = ["nombre", "precio", "precio_anterior", "sku", "codigo_barras", "categoria", "cantidad"]

    return NextResponse.json({ rows, columns, total: rows.length, storeId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
