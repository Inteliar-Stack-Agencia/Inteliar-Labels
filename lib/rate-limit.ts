import type { SupabaseClient } from "@supabase/supabase-js"

// Simple sliding-window rate limiter backed by the `api_rate_limits` table.
// Fails OPEN (allows the request) if the rate-limit check itself errors out,
// so a Supabase hiccup never blocks legitimate traffic.
export async function checkRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const id = `${bucket}:${identifier}`
  const now = Date.now()

  try {
    const { data: row } = await supabase
      .from("api_rate_limits")
      .select("count, window_start")
      .eq("id", id)
      .maybeSingle()

    if (!row || now - new Date(row.window_start).getTime() > windowSeconds * 1000) {
      // New window
      await supabase
        .from("api_rate_limits")
        .upsert({ id, count: 1, window_start: new Date(now).toISOString() })
      return { allowed: true, remaining: limit - 1 }
    }

    if (row.count >= limit) {
      return { allowed: false, remaining: 0 }
    }

    await supabase
      .from("api_rate_limits")
      .update({ count: row.count + 1 })
      .eq("id", id)

    return { allowed: true, remaining: limit - row.count - 1 }
  } catch (err) {
    console.error("[rate-limit] check failed, allowing request:", err)
    return { allowed: true, remaining: limit }
  }
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}
