// Dummy values so modules that call createClient() at import time (Supabase)
// don't throw during test collection. Tests never make real network calls.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://placeholder.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "placeholder-anon-key"
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "placeholder-service-key"
process.env.MERCADOPAGO_ACCESS_TOKEN ||= "placeholder-mp-token"
process.env.MERCADOPAGO_WEBHOOK_SECRET ||= "placeholder-mp-secret"
