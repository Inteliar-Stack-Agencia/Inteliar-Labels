// Browser-side client for the Inteliar Printer Agent (localhost:9638)
// Supports agent v2: multi-printer, TCP/IP, USB, Serial

const DEFAULT_AGENT_URL = 'http://localhost:9638'

export interface PrinterConfig {
  id: string
  name: string
  brand?: string
  connection: 'tcp' | 'usb' | 'serial' | 'simulate'
  language?: 'zpl' | 'tspl' | 'cpcl' | 'sbpl' | 'auto'
  host?: string
  port?: number
  usbQueue?: string
  serialPort?: string
  baudRate?: number
  /** For USB printers using the Windows-driver image path: some drivers
   * (e.g. Honeywell/Seagull) mirror the printed page on one axis. */
  imageFlip?: 'none' | 'v' | 'h' | 'both'
}

export interface AgentStatus {
  service: string
  version?: string
  status: string
  defaultPrinter?: PrinterConfig | null
  printerCount?: number
  totalJobs: number
  platform?: string
  // v1 compat
  printer?: { ip: string; port: number; simulate: boolean }
  stats?: { totalJobs: number; lastJob: unknown }
}

export interface PrintResult {
  success: boolean
  message?: string
  labels?: number
  mode?: string
  format?: string
  printer?: string
  printerName?: string
  durationMs?: number
  error?: string
}

export interface AgentLogEntry {
  timestamp: string
  printer?: string
  printerName?: string
  labels: number
  mode: string
  format: string
  bytes: number
  status: string
  durationMs?: number
  error?: string
}

export function getPrinterAgentUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('printerAgentUrl') ?? DEFAULT_AGENT_URL
  }
  return DEFAULT_AGENT_URL
}

export async function checkPrinterAgent(agentUrl?: string): Promise<AgentStatus> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/status`, { signal: AbortSignal.timeout(3000) })
  if (!res.ok) throw new Error(`Agent respondió ${res.status}`)
  return res.json() as Promise<AgentStatus>
}

export async function listPrinters(agentUrl?: string): Promise<PrinterConfig[]> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/printers`, { signal: AbortSignal.timeout(3000) })
  if (!res.ok) throw new Error(`Error listando impresoras: ${res.status}`)
  return res.json() as Promise<PrinterConfig[]>
}

export async function savePrinter(printer: PrinterConfig, agentUrl?: string): Promise<{ success: boolean; printer: PrinterConfig }> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/printers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(printer),
  })
  if (!res.ok) throw new Error(`Error guardando impresora: ${res.status}`)
  return res.json()
}

export async function deletePrinter(id: string, agentUrl?: string): Promise<void> {
  const url = agentUrl ?? getPrinterAgentUrl()
  await fetch(`${url}/printers/${id}`, { method: 'DELETE' })
}

export async function setDefaultPrinter(id: string, agentUrl?: string): Promise<void> {
  const url = agentUrl ?? getPrinterAgentUrl()
  await fetch(`${url}/printers/${id}/default`, { method: 'POST' })
}

export async function testPrinter(id: string, agentUrl?: string): Promise<PrintResult> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/printers/${id}/test`, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
  })
  return res.json() as Promise<PrintResult>
}

export async function discoverUsbPrinters(agentUrl?: string): Promise<Array<{ Name: string; DriverName?: string; PortName?: string }>> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/discover/usb`, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`Error detectando impresoras USB: ${res.status}`)
  return res.json()
}

export async function discoverNetworkPrinters(
  subnet?: string,
  agentUrl?: string
): Promise<Array<{ ip: string; port: number; status: string }>> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const params = subnet ? `?subnet=${subnet}` : ''
  const res = await fetch(`${url}/discover/network${params}`, { signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`Error escaneando red: ${res.status}`)
  return res.json()
}

export interface SendOptions {
  agentUrl?: string
  printerId?: string
  /** Number of automatic retries on failure (default 2 = 3 attempts total) */
  retries?: number
  /** Called before each retry with (attemptNumber, error) */
  onRetry?: (attempt: number, error: Error) => void
}

async function sendOnce(
  data: string,
  type: 'zpl' | 'tspl',
  url: string,
  printerId?: string
): Promise<PrintResult> {
  const endpoint = printerId ? `${url}/print/${printerId}` : `${url}/print`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
    signal: AbortSignal.timeout(20000),
  })
  const result = await res.json() as PrintResult
  if (!res.ok || result.success === false) {
    throw new Error(result.error ?? result.message ?? 'Error de impresión')
  }
  return result
}

export async function sendToPrinterAgent(
  data: string,
  type: 'zpl' | 'tspl' = 'zpl',
  agentUrlOrOpts?: string | SendOptions,
  printerId?: string
): Promise<PrintResult> {
  // Backwards-compatible: 3rd arg can be a string (agentUrl) or an options object
  const opts: SendOptions = typeof agentUrlOrOpts === 'string'
    ? { agentUrl: agentUrlOrOpts, printerId }
    : (agentUrlOrOpts ?? {})

  const url = opts.agentUrl ?? getPrinterAgentUrl()
  const pid = opts.printerId ?? printerId
  const maxRetries = opts.retries ?? 2

  let lastError: Error = new Error('Error de impresión')
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await sendOnce(data, type, url, pid)
    } catch (e) {
      lastError = e as Error
      if (attempt < maxRetries) {
        opts.onRetry?.(attempt + 1, lastError)
        // Exponential backoff: 1s, 2s, 4s…
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
      }
    }
  }
  throw lastError
}

/**
 * Print pre-rendered label images through the printer's Windows driver.
 * Use this for USB printers whose driver does not interpret raw ZPL.
 */
export async function sendImagesToPrinterAgent(
  images: string[],
  widthMm: number,
  heightMm: number,
  opts: { agentUrl?: string; printerId?: string } = {},
): Promise<PrintResult> {
  const url = opts.agentUrl ?? getPrinterAgentUrl()
  const endpoint = opts.printerId ? `${url}/print-image/${opts.printerId}` : `${url}/print-image`
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, widthMm, heightMm }),
    signal: AbortSignal.timeout(120000),
  })
  const result = (await res.json()) as PrintResult
  if (!res.ok || result.success === false) {
    throw new Error(result.error ?? result.message ?? "Error de impresión por driver")
  }
  return result
}

export async function getPrinterAgentLog(agentUrl?: string): Promise<AgentLogEntry[]> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/log`)
  if (!res.ok) throw new Error('No se pudo obtener el log del agente')
  return res.json() as Promise<AgentLogEntry[]>
}

// ── Cloud relay (remote printing across networks) ──────────────────────────────

export interface RemotePrinter {
  id: string
  name: string
  connection: PrinterConfig['connection']
  online: boolean
  lastSeen: string
}

/** List printers registered by the account's agents, with live online status. */
export async function listRemotePrinters(): Promise<RemotePrinter[]> {
  const res = await fetch('/api/print/relay', { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []
  const json = (await res.json()) as { printers?: RemotePrinter[] }
  return json.printers ?? []
}

/**
 * Send a print job to a remote printer via the cloud relay, then poll until the
 * agent reports done/error (or we time out waiting).
 */
export async function sendViaCloudRelay(
  printerId: string,
  data: string,
  type: 'zpl' | 'tspl' = 'zpl',
  opts: { timeoutMs?: number; pollMs?: number } = {},
): Promise<PrintResult> {
  const timeoutMs = opts.timeoutMs ?? 30000
  const pollMs = opts.pollMs ?? 1500

  const res = await fetch('/api/print/relay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printerId, type, data }),
  })
  const enqueue = (await res.json()) as { jobId?: string; error?: string }
  if (!res.ok || !enqueue.jobId) {
    throw new Error(enqueue.error ?? 'No se pudo encolar el trabajo remoto')
  }

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs))
    const s = await fetch(`/api/print/relay/${enqueue.jobId}`, { signal: AbortSignal.timeout(8000) })
    if (!s.ok) continue
    const job = (await s.json()) as { status: string; error?: string }
    if (job.status === 'done') return { success: true, message: 'Impreso en impresora remota' }
    if (job.status === 'error') throw new Error(job.error ?? 'Error en la impresora remota')
  }
  throw new Error('La impresora remota no respondió a tiempo. ¿Está encendida y conectada?')
}
