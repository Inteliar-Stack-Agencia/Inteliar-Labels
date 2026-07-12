import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CLIENT_ID = process.env.MERCADOLIBRE_CLIENT_ID
const CLIENT_SECRET = process.env.MERCADOLIBRE_CLIENT_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

export const ML_REDIRECT_URI = `${APP_URL}/api/integrations/mercadolibre/callback`

// Mercado Libre's OAuth authorization screen and storefront both live on a
// per-country domain (auth.mercadolibre.<tld>, except Brazil which uses
// "mercadolivre"). MERCADOLIBRE_SITE selects which one to use — defaults to
// Argentina (MLA), where this app is registered today. Set it per deploy
// when expanding to another country.
const ML_SITE_DOMAINS: Record<string, string> = {
  MLA: "mercadolibre.com.ar", // Argentina
  MLB: "mercadolivre.com.br", // Brasil
  MLM: "mercadolibre.com.mx", // México
  MCO: "mercadolibre.com.co", // Colombia
  MLC: "mercadolibre.cl", // Chile
  MLU: "mercadolibre.com.uy", // Uruguay
  MPE: "mercadolibre.com.pe", // Perú
  MLV: "mercadolibre.com.ve", // Venezuela
  MEC: "mercadolibre.com.ec", // Ecuador
  MBO: "mercadolibre.com.bo", // Bolivia
  MPY: "mercadolibre.com.py", // Paraguay
  MCR: "mercadolibre.co.cr", // Costa Rica
  MPA: "mercadolibre.com.pa", // Panamá
  MDO: "mercadolibre.com.do", // República Dominicana
  MGT: "mercadolibre.com.gt", // Guatemala
  MHN: "mercadolibre.com.hn", // Honduras
  MNI: "mercadolibre.com.ni", // Nicaragua
  MSV: "mercadolibre.com.sv", // El Salvador
}

const ML_SITE = (process.env.MERCADOLIBRE_SITE || "MLA").toUpperCase()

// The seller-facing domain for this site (e.g. to link to
// "Preferencias de venta" or other account settings pages).
export function getStorefrontDomain(): string {
  return ML_SITE_DOMAINS[ML_SITE] ?? ML_SITE_DOMAINS.MLA
}

export function isMercadolibreConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET)
}

export function getAuthorizationUrl(state: string): string {
  const url = new URL(`https://auth.${getStorefrontDomain()}/authorization`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", CLIENT_ID!)
  url.searchParams.set("redirect_uri", ML_REDIRECT_URI)
  url.searchParams.set("state", state)
  return url.toString()
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  refresh_token: string
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      code,
      redirect_uri: ML_REDIRECT_URI,
    }),
  })
  if (!res.ok) throw new Error(`ML token exchange failed (${res.status}): ${await res.text()}`)
  return res.json()
}

async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token,
    }),
  })
  if (!res.ok) throw new Error(`ML token refresh failed (${res.status}): ${await res.text()}`)
  return res.json()
}

export async function saveConnection(userId: string, token: TokenResponse): Promise<void> {
  const expires_at = new Date(Date.now() + token.expires_in * 1000).toISOString()
  const { error } = await supabaseAdmin.from("mercadolibre_connections").upsert({
    user_id: userId,
    ml_user_id: String(token.user_id),
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at,
  })
  if (error) throw new Error(`Failed to save ML connection: ${error.message}`)
}

export async function isConnected(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("mercadolibre_connections")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to check ML connection: ${error.message}`)
  return Boolean(data)
}

export async function disconnect(userId: string): Promise<void> {
  await supabaseAdmin.from("mercadolibre_connections").delete().eq("user_id", userId)
}

// Returns a valid access token for the user, refreshing it first if it's
// close to expiring. Throws if the user never connected their account.
async function getValidAccessToken(userId: string): Promise<{ accessToken: string; mlUserId: string }> {
  const { data: conn } = await supabaseAdmin
    .from("mercadolibre_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (!conn) throw new Error("No conectaste tu cuenta de Mercado Libre todavía.")

  const expiresAt = new Date(conn.expires_at).getTime()
  const needsRefresh = expiresAt - Date.now() < 5 * 60 * 1000 // refresh 5min before expiry

  if (!needsRefresh) return { accessToken: conn.access_token, mlUserId: conn.ml_user_id }

  const fresh = await refreshToken(conn.refresh_token)
  await saveConnection(userId, fresh)
  return { accessToken: fresh.access_token, mlUserId: String(fresh.user_id) }
}

interface MLOrder {
  id: number
  date_created: string
  order_items: { item: { title: string; seller_sku?: string }; quantity: number; unit_price: number }[]
  buyer: { nickname: string; first_name?: string; last_name?: string }
  shipping: { id: number | null } | null
}

interface MLShipmentAddress {
  receiver_name?: string
  address_line?: string
  city?: { name: string }
  state?: { name: string }
  zip_code?: string
  receiver_phone?: string
}

async function mlFetch(path: string, accessToken: string) {
  const res = await fetch(`https://api.mercadolibre.com${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Mercado Libre API error (${res.status}) en ${path}`)
  return res.json()
}

async function fetchRecentOrders(accessToken: string, mlUserId: string): Promise<MLOrder[]> {
  const data = await mlFetch(
    `/orders/search?seller=${mlUserId}&order.status=paid&sort=date_desc&limit=50`,
    accessToken
  )
  return data.results ?? []
}

export type ImportMode = "shipping" | "product"

export async function fetchOrderRows(
  userId: string,
  mode: ImportMode
): Promise<{ columns: string[]; rows: Record<string, string>[] }> {
  const { accessToken, mlUserId } = await getValidAccessToken(userId)
  const orders = await fetchRecentOrders(accessToken, mlUserId)

  if (mode === "shipping") {
    const columns = ["destinatario", "direccion", "localidad", "provincia", "cp", "telefono", "nro_orden"]
    const rows: Record<string, string>[] = []

    for (const order of orders) {
      const shippingId = order.shipping?.id
      let address: MLShipmentAddress = {}
      if (shippingId) {
        try {
          const shipment = await mlFetch(`/shipments/${shippingId}`, accessToken)
          address = shipment.receiver_address ?? {}
        } catch {
          // Some orders (pickup, no shipment yet) won't have an address — skip silently
        }
      }
      const buyerName =
        address.receiver_name ||
        `${order.buyer.first_name ?? ""} ${order.buyer.last_name ?? ""}`.trim() ||
        order.buyer.nickname

      rows.push({
        destinatario: buyerName,
        direccion: address.address_line ?? "",
        localidad: address.city?.name ?? "",
        provincia: address.state?.name ?? "",
        cp: address.zip_code ?? "",
        telefono: address.receiver_phone ?? "",
        nro_orden: String(order.id),
      })
    }

    return { columns, rows }
  }

  // mode === "product"
  const columns = ["nombre", "sku", "cantidad", "precio", "nro_orden"]
  const rows: Record<string, string>[] = []

  for (const order of orders) {
    for (const item of order.order_items ?? []) {
      rows.push({
        nombre: item.item.title,
        sku: item.item.seller_sku ?? "",
        cantidad: String(item.quantity),
        precio: String(item.unit_price),
        nro_orden: String(order.id),
      })
    }
  }

  return { columns, rows }
}

// Fetches Mercado Libre's own official shipping labels (the ones with ML's
// tracking barcode that couriers scan) in raw ZPL — not a label we design,
// just what Mercado Envíos generates — so it can be sent straight to the
// user's thermal printer instead of downloading a PDF and reprinting it.
export async function fetchShippingLabelsZpl(userId: string): Promise<{ zpl: string; count: number }> {
  const { accessToken, mlUserId } = await getValidAccessToken(userId)
  const orders = await fetchRecentOrders(accessToken, mlUserId)

  const shipmentIds = orders
    .map((o) => o.shipping?.id)
    .filter((id): id is number => typeof id === "number")

  if (shipmentIds.length === 0) {
    return { zpl: "", count: 0 }
  }

  const res = await fetch(
    `https://api.mercadolibre.com/shipment_labels?shipment_ids=${shipmentIds.join(",")}&response_type=zpl2`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`No se pudieron obtener las etiquetas de envío (${res.status})`)

  const zpl = await res.text()
  return { zpl, count: shipmentIds.length }
}
