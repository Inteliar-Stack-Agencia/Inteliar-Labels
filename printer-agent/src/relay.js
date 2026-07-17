/**
 * Cloud print relay (Supabase Realtime).
 *
 * Lets a browser on another machine/network send a print job to this agent.
 * The agent connects OUTBOUND to Supabase (no open ports needed), registers its
 * printers as "online", and subscribes to print_jobs rows for its license_key.
 * When a job arrives it prints locally (reusing the same doPrint) and writes the
 * result back to the row.
 *
 * Enabled only when SUPABASE_URL + SUPABASE_ANON_KEY are provided (via env or
 * agent-config.json) and the account plan allows it.
 */

import { createClient } from '@supabase/supabase-js'

const HEARTBEAT_MS = 30000
const OFFLINE_GRACE_MS = 120000 // must match the cron that flips to 'offline'

let supabase = null
let channel = null
let heartbeat = null

export function relayConfigured(cfg) {
  return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey)
}

/**
 * @param {object} opts
 * @param {string} opts.supabaseUrl
 * @param {string} opts.supabaseAnonKey
 * @param {string} opts.licenseKey
 * @param {string} opts.deviceId
 * @param {() => Array} opts.getPrinters   returns current printer configs
 * @param {(printerId: string, payload: {type:string,data:string}) => Promise<object>} opts.print
 */
export async function startRelay(opts) {
  const { supabaseUrl, supabaseAnonKey, licenseKey, deviceId, getPrinters, print } = opts

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })

  await registerPrinters(licenseKey, deviceId, getPrinters())

  // Subscribe to new jobs for this license
  channel = supabase
    .channel(`print_jobs:${licenseKey}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'print_jobs',
        filter: `license_key=eq.${licenseKey}`,
      },
      (payload) => handleJob(payload.new, getPrinters, print)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Relay] ✓ Conectado a la nube — impresión remota activa')
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[Relay] ⚠ Estado del canal: ${status}`)
      }
    })

  // Heartbeat keeps last_seen fresh so the server knows we're online
  heartbeat = setInterval(() => {
    registerPrinters(licenseKey, deviceId, getPrinters()).catch(() => {})
  }, HEARTBEAT_MS)

  // Catch any jobs that arrived while we were briefly disconnected
  await drainPending(licenseKey, getPrinters, print)
}

export async function stopRelay(licenseKey) {
  if (heartbeat) clearInterval(heartbeat)
  if (channel) await supabase?.removeChannel(channel)
  if (supabase && licenseKey) {
    await supabase
      .from('agent_connections')
      .update({ status: 'offline', last_seen: new Date().toISOString() })
      .eq('license_key', licenseKey)
      .catch(() => {})
  }
}

async function registerPrinters(licenseKey, deviceId, printers) {
  if (!supabase) return
  const rows = printers.map((p) => ({
    license_key: licenseKey,
    printer_id: p.id,
    printer_name: p.name,
    connection: p.connection,
    device_id: deviceId,
    status: 'online',
    last_seen: new Date().toISOString(),
  }))
  if (rows.length === 0) return
  const { error } = await supabase
    .from('agent_connections')
    .upsert(rows, { onConflict: 'license_key,printer_id' })
  if (error) console.warn('[Relay] No se pudo registrar impresoras:', error.message)
}

async function handleJob(job, getPrinters, print) {
  if (!job || job.status !== 'pending') return
  const printer = getPrinters().find((p) => p.id === job.printer_id)
  if (!printer) return // not our printer

  console.log(`[Relay] ▼ Trabajo remoto ${job.id} → ${printer.name}`)
  try {
    const result = await print(job.printer_id, job.payload)
    await supabase
      .from('print_jobs')
      .update({ status: 'done', result, completed_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', 'pending')
    console.log(`[Relay] ✓ Trabajo ${job.id} impreso`)
  } catch (e) {
    await supabase
      .from('print_jobs')
      .update({ status: 'error', error: e.message, completed_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', 'pending')
    console.warn(`[Relay] ✗ Trabajo ${job.id}: ${e.message}`)
  }
}

// On startup, process any still-pending jobs for our printers.
async function drainPending(licenseKey, getPrinters, print) {
  if (!supabase) return
  const ids = getPrinters().map((p) => p.id)
  if (ids.length === 0) return
  const { data } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('license_key', licenseKey)
    .eq('status', 'pending')
    .in('printer_id', ids)
  for (const job of data ?? []) await handleJob(job, getPrinters, print)
}
