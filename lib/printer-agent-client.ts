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

export async function sendToPrinterAgent(
  data: string,
  type: 'zpl' | 'tspl' = 'zpl',
  agentUrl?: string,
  printerId?: string
): Promise<PrintResult> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const endpoint = printerId ? `${url}/print/${printerId}` : `${url}/print`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  })
  const result = await res.json() as PrintResult
  if (!res.ok) throw new Error(result.error ?? result.message ?? 'Error de impresión')
  return result
}

export async function getPrinterAgentLog(agentUrl?: string): Promise<AgentLogEntry[]> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/log`)
  if (!res.ok) throw new Error('No se pudo obtener el log del agente')
  return res.json() as Promise<AgentLogEntry[]>
}
