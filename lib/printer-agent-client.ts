// Browser-side client for the local Inteliar Printer Agent (localhost:9638)
// The printer-agent bridges HTTP → TCP to the thermal printer.
// This client is called from React components; the agent URL is configurable
// so it works even when Next.js is deployed to Vercel.

const DEFAULT_AGENT_URL = 'http://localhost:9638'

export interface AgentStatus {
  service: string
  status: string
  printer: { ip: string; port: number; simulate: boolean }
  stats: { totalJobs: number; lastJob: unknown }
}

export interface PrintResult {
  success: boolean
  message: string
  labels: number
  mode: string
  format: string
}

export interface AgentLogEntry {
  timestamp: string
  labels: number
  mode: string
  format: string
  bytes: number
  status: string
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
  if (!res.ok) throw new Error(`Agent respondio ${res.status}`)
  return res.json() as Promise<AgentStatus>
}

export async function sendToPrinterAgent(
  data: string,
  type: 'zpl' | 'tspl' = 'zpl',
  agentUrl?: string
): Promise<PrintResult> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data })
  })
  const result = await res.json() as PrintResult
  if (!res.ok) throw new Error(result.message ?? 'Error de impresion')
  return result
}

export async function getPrinterAgentLog(agentUrl?: string): Promise<AgentLogEntry[]> {
  const url = agentUrl ?? getPrinterAgentUrl()
  const res = await fetch(`${url}/log`)
  if (!res.ok) throw new Error('No se pudo obtener el log del agente')
  return res.json() as Promise<AgentLogEntry[]>
}
