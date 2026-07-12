import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID
const CLIENT_SECRET = process.env.TIENDANUBE_CLIENT_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

export const TN_REDIRECT_URI = `${APP_URL}/api/integrations/tiendanube/callback`
const USER_AGENT = "InteliarLabels/1.0 (soporte@inteliarstack.com)"

export function isTiendanubeConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET)
}

// Tiendanube's install flow doesn't take a redirect_uri param — the callback
// URL is whatever is registered on the app in Partners, and store/user
// association only works because the browser that visits this URL is
// already logged into our app (checked in the authorize/callback routes).
export function getAuthorizationUrl(): string {
  return `https://www.tiendanube.com/apps/${CLIENT_ID}/authorize`
}

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  user_id: number
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const res = await fetch("https://www.tiendanube.com/apps/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
    }),
  })
  if (!res.ok) throw new Error(`TN token exchange failed (${res.status}): ${await res.text()}`)
  return res.json()
}

export async function saveConnection(userId: string, token: TokenResponse): Promise<void> {
  const { error } = await supabaseAdmin.from("tiendanube_connections").upsert({
    user_id: userId,
    store_id: String(token.user_id),
    access_token: token.access_token,
    scope: token.scope,
  })
  if (error) throw new Error(`Failed to save Tiendanube connection: ${error.message}`)
}

export async function isConnected(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("tiendanube_connections")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to check Tiendanube connection: ${error.message}`)
  return Boolean(data)
}

export async function disconnect(userId: string): Promise<void> {
  await supabaseAdmin.from("tiendanube_connections").delete().eq("user_id", userId)
}

async function getConnection(userId: string): Promise<{ accessToken: string; storeId: string }> {
  const { data: conn } = await supabaseAdmin
    .from("tiendanube_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()
  if (!conn) throw new Error("No conectaste tu tienda de Tiendanube todavía.")
  return { accessToken: conn.access_token, storeId: conn.store_id }
}

interface TNOrder {
  id: number
  number: number
  shipping_address: {
    name?: string
    address?: string
    city?: string
    province?: string
    zipcode?: string
    phone?: string
  } | null
  products: { name: string; sku: string | null; price: string; quantity: number }[]
  shipping_status?: string | null
}

// Confirmed against a real order via the API (2026-07-12): pending orders
// have shipping_status "unshipped". Anything else (e.g. "shipped") — or the
// field being absent — is treated as already handled.
function isTnPending(order: Pick<TNOrder, "shipping_status">): boolean {
  return !order.shipping_status || order.shipping_status === "unshipped"
}

async function tnFetch(storeId: string, path: string, accessToken: string) {
  const res = await fetch(`https://api.tiendanube.com/v1/${storeId}${path}`, {
    headers: {
      Authentication: `bearer ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    // Tiendanube returns a 404 with "Last page is 0" instead of an empty
    // array when a filtered list (e.g. orders) has zero results — treat
    // that specific case as "nothing found", not an error.
    if (res.status === 404 && /last page is 0/i.test(body)) {
      return []
    }
    throw new Error(`Tiendanube API error (${res.status}) en ${path}${body ? `: ${body.slice(0, 300)}` : ""}`)
  }
  return res.json()
}

async function fetchRecentOrders(storeId: string, accessToken: string): Promise<TNOrder[]> {
  const data = await tnFetch(
    storeId,
    "/orders?status=any&payment_status=paid&per_page=50&fields=id,number,shipping_address,products,shipping_status",
    accessToken
  )
  return Array.isArray(data) ? data : []
}

export type ImportMode = "shipping" | "product"

export async function fetchOrderRows(
  userId: string,
  mode: ImportMode
): Promise<{ columns: string[]; rows: Record<string, string>[] }> {
  const { accessToken, storeId } = await getConnection(userId)
  const allOrders = await fetchRecentOrders(storeId, accessToken)

  // Sort pending-shipment orders first (not filtered out) — mirrors ML's behavior.
  const orders = [...allOrders].sort((a, b) => (isTnPending(a) ? 0 : 1) - (isTnPending(b) ? 0 : 1))

  if (mode === "shipping") {
    const columns = ["destinatario", "direccion", "localidad", "provincia", "cp", "telefono", "nro_orden"]
    const rows = orders.map((order) => {
      const a = order.shipping_address ?? {}
      return {
        destinatario: a.name ?? "",
        direccion: a.address ?? "",
        localidad: a.city ?? "",
        provincia: a.province ?? "",
        cp: a.zipcode ?? "",
        telefono: a.phone ?? "",
        nro_orden: String(order.number ?? order.id),
      }
    })
    return { columns, rows }
  }

  // mode === "product"
  const columns = ["nombre", "sku", "cantidad", "precio", "nro_orden"]
  const rows: Record<string, string>[] = []
  for (const order of orders) {
    for (const item of order.products ?? []) {
      rows.push({
        nombre: item.name,
        sku: item.sku ?? "",
        cantidad: String(item.quantity),
        precio: String(item.price),
        nro_orden: String(order.number ?? order.id),
      })
    }
  }
  return { columns, rows }
}

interface TNProduct {
  id: number
  name: Record<string, string>
  categories: { name: Record<string, string> }[]
  variants: {
    sku: string | null
    price: string
    compare_at_price: string | null
    barcode: string | null
    values: { es?: string; pt?: string }[]
  }[]
}

async function fetchAllProducts(storeId: string, accessToken: string): Promise<TNProduct[]> {
  const products: TNProduct[] = []
  let page = 1
  const perPage = 200
  while (true) {
    const batch: TNProduct[] = await tnFetch(
      storeId,
      `/products?page=${page}&per_page=${perPage}&fields=id,name,variants,categories`,
      accessToken
    )
    if (!Array.isArray(batch) || batch.length === 0) break
    products.push(...batch)
    if (batch.length < perPage) break
    page++
  }
  return products
}

function firstLocalized(obj: Record<string, string> | undefined): string {
  if (!obj) return ""
  return obj.es || obj.pt || Object.values(obj)[0] || ""
}

// Full published catalog (not just what's been sold in orders) — via the
// authenticated store connection instead of scraping a public storefront.
export async function fetchCatalogRows(userId: string): Promise<{ columns: string[]; rows: Record<string, string>[] }> {
  const { accessToken, storeId } = await getConnection(userId)
  const products = await fetchAllProducts(storeId, accessToken)

  const columns = ["nombre", "precio", "precio_anterior", "sku", "codigo_barras", "categoria", "cantidad"]
  const rows: Record<string, string>[] = []

  for (const product of products) {
    const name = firstLocalized(product.name)
    const category = firstLocalized(product.categories?.[0]?.name)

    for (const variant of product.variants ?? []) {
      const variantOptions = (variant.values ?? [])
        .map((v) => v.es || v.pt || Object.values(v)[0] || "")
        .filter(Boolean)
        .join(" / ")

      rows.push({
        nombre: variantOptions ? `${name} — ${variantOptions}` : name,
        precio: variant.price ?? "",
        precio_anterior: variant.compare_at_price ?? "",
        sku: variant.sku ?? "",
        codigo_barras: variant.barcode ?? "",
        categoria: category,
        cantidad: "1",
      })
    }
  }

  return { columns, rows }
}
