/**
 * Inteliar Printer Agent
 * Multi-brand, multi-connection thermal printer bridge.
 *
 * Connection types: tcp | usb | serial | simulate
 * Brands: Zebra (ZPL), Honeywell (ZPL/Autosense), TSC (TSPL2),
 *         Citizen (ZPL/TSPL2), Sato (SBPL), Bixolon (ZPL/TSPL2)
 *
 * API:
 *   GET  /status              — agent health + default printer
 *   GET  /printers            — list all configured printers
 *   POST /printers            — add or update a printer config
 *   DELETE /printers/:id      — remove a printer
 *   POST /printers/:id/test   — send test label
 *   POST /printers/:id/default — set as default
 *   GET  /discover/usb        — list USB/OS printers (Windows: Get-Printer, Linux: lpstat)
 *   POST /print               — print to default printer
 *   POST /print/:id           — print to specific printer
 *   GET  /log                 — last 100 print jobs
 */

import express from 'express'
import cors from 'cors'
import net from 'net'
import fs from 'fs'
import path from 'path'
import { execFile, exec } from 'child_process'
import { fileURLToPath } from 'url'
import os from 'os'
import { randomUUID } from 'crypto'
import { createInterface } from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// CONFIG_PATH can be overridden by env (Electron passes the userData dir)
const CONFIG_PATH = process.env.CONFIG_PATH || path.join(__dirname, '..', 'printers.json')
const LICENSE_PATH = path.join(__dirname, '..', 'license.json')
const PORT = process.env.AGENT_PORT || 9638

// ── License ───────────────────────────────────────────────────────────────────

// LICENSE_SERVER: set via env var, agent-config.json next to .exe, or fallback
function getLicenseServer() {
  if (process.env.LICENSE_SERVER) return process.env.LICENSE_SERVER
  try {
    const cfgPath = path.join(__dirname, '..', 'agent-config.json')
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
      if (cfg.licenseServer) return cfg.licenseServer
    }
  } catch {}
  return 'https://etiquetar.app'
}
const LICENSE_SERVER = getLicenseServer()

function getDeviceId() {
  try {
    if (fs.existsSync(LICENSE_PATH)) {
      const d = JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'))
      if (d.device_id) return d.device_id
    }
  } catch {}
  const id = randomUUID()
  saveLicense({ device_id: id })
  return id
}

function loadLicense() {
  try {
    if (fs.existsSync(LICENSE_PATH)) return JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'))
  } catch {}
  return {}
}

function saveLicense(data) {
  const current = loadLicense()
  fs.writeFileSync(LICENSE_PATH, JSON.stringify({ ...current, ...data }, null, 2))
}

async function validateLicense(key, deviceId) {
  try {
    const os = await import('os')
    const res = await fetch(`${LICENSE_SERVER}/api/license/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, device_id: deviceId, hostname: os.default.hostname() }),
      signal: AbortSignal.timeout(10000),
    })
    return await res.json()
  } catch (e) {
    return { valid: false, message: `Sin conexión al servidor: ${e.message}` }
  }
}

function promptKey() {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    process.stdout.write('\n╔══════════════════════════════════════════════╗\n')
    process.stdout.write('║       Inteliar Printer Agent — Activación    ║\n')
    process.stdout.write('╚══════════════════════════════════════════════╝\n')
    process.stdout.write('\nIngresá tu clave de licencia (INTELIAR-XXXX-XXXX-XXXX):\n> ')
    rl.once('line', (line) => { rl.close(); resolve(line.trim()) })
  })
}

async function ensureLicense() {
  const deviceId = getDeviceId()
  const stored = loadLicense()
  let key = stored.key

  // No key stored → prompt
  if (!key) {
    key = await promptKey()
    if (!key) { console.error('[Licencia] Clave requerida. Cerrando.'); process.exit(1) }
  }

  console.log('[Licencia] Validando clave...')
  const result = await validateLicense(key, deviceId)

  if (result.valid) {
    saveLicense({ key, plan: result.plan, validated_at: new Date().toISOString() })
    console.log(`[Licencia] ✓ Válida — Plan: ${result.plan === 'lifetime' ? 'De por vida' : 'Mensual'} (${result.devices_used}/${result.max_devices} dispositivos)`)
    return true
  }

  // Invalid — clear key if it's a permanent rejection (not network error)
  const permanent = result.message && !result.message.includes('Sin conexión')
  if (permanent) {
    saveLicense({ key: null })
    console.error(`[Licencia] ✗ ${result.message}`)
    // If limit or suspension, exit. If never validated before, exit. If previously validated, allow offline grace.
    if (!stored.validated_at) {
      console.error('[Licencia] No se pudo activar. Cerrando.')
      process.exit(1)
    }
    console.warn('[Licencia] ⚠ Usando modo gracia offline (última validación: ' + stored.validated_at + ')')
    return true
  }

  // Network error — if previously validated, allow offline grace period
  if (stored.validated_at) {
    const lastValidated = new Date(stored.validated_at)
    const daysSince = (Date.now() - lastValidated.getTime()) / 86400000
    if (daysSince <= 7) {
      console.warn(`[Licencia] ⚠ Sin conexión — modo gracia offline (${Math.ceil(daysSince)}d / 7d). ${result.message}`)
      return true
    }
    console.error(`[Licencia] ✗ Sin conexión por más de 7 días. Cerrando.`)
    process.exit(1)
  }

  console.error(`[Licencia] ✗ ${result.message}\n[Licencia] Cerrando.`)
  process.exit(1)
}

const app = express()
// Chrome's Private Network Access blocks fetches from a public HTTPS page
// (etiquetar.app) to a loopback address (localhost:9638) unless the preflight
// response explicitly allows it — without this header, the browser silently
// rejects the request even though this server is up and reachable.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  next()
})
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ── Config persistence ────────────────────────────────────────────────────────

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    }
  } catch (e) {
    console.error('[Config] Error loading printers.json:', e.message)
  }
  return { defaultPrinterId: null, printers: [] }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

let config = loadConfig()

// If no printers configured, add a default simulate entry
if (config.printers.length === 0) {
  config.printers.push({
    id: 'default',
    name: 'Simulador',
    brand: 'generic',
    connection: 'simulate',
    language: 'zpl',
  })
  config.defaultPrinterId = 'default'
  saveConfig(config)
}

// ── Print log ─────────────────────────────────────────────────────────────────

const printLog = []

function logJob(entry) {
  printLog.push({ ...entry, timestamp: new Date().toISOString() })
  if (printLog.length > 200) printLog.shift()
}

// ── Format detection ──────────────────────────────────────────────────────────

function detectFormat(data) {
  if (data.includes('^XA') || data.includes('^xa')) return 'zpl'
  if (/^SIZE\s/m.test(data) || /^PRINT\s/m.test(data)) return 'tspl'
  if (/^!\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+/m.test(data)) return 'cpcl'
  if (/^A\d{3};\d+;\d+/m.test(data)) return 'sbpl'
  return 'raw'
}

function countLabels(data, format) {
  if (format === 'zpl') return (data.match(/\^XA/gi) || []).length
  if (format === 'tspl') return (data.match(/^PRINT\s+\d+/gm) || []).length
  if (format === 'cpcl') return (data.match(/^FORM\b/gm) || []).length
  return 1
}

// ── Language init sequences (sent before data to force mode) ─────────────────

function prependInit(data, printer) {
  const lang = printer.language || detectFormat(data)
  if (lang === 'tspl') {
    // ESC+!+R resets Honeywell/TSC to TSPL2 mode
    return '\x1b!R\r\nSET CUTTER OFF\r\n' + data
  }
  if (lang === 'zpl') {
    // ~JR resets ZPL-capable printers
    return data
  }
  return data
}

// ── Connection: TCP/IP ────────────────────────────────────────────────────────

function printViaTcp(data, printer) {
  return new Promise((resolve, reject) => {
    const host = printer.host || '127.0.0.1'
    const port = printer.port || 9100
    const timeout = setTimeout(() => {
      client.destroy()
      reject(new Error(`Timeout conectando a ${host}:${port}`))
    }, 10000)

    const client = new net.Socket()
    client.connect(port, host, () => {
      clearTimeout(timeout)
      client.write(data, 'binary', () => {
        client.end()
        resolve()
      })
    })
    client.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`TCP ${host}:${port} — ${err.message}`))
    })
  })
}

// ── Connection: Serial ────────────────────────────────────────────────────────

async function printViaSerial(data, printer) {
  let SerialPort
  try {
    const sp = await import('serialport')
    SerialPort = sp.SerialPort
  } catch {
    throw new Error('Paquete serialport no instalado. Ejecute: npm install serialport')
  }

  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: printer.serialPort || 'COM1',
      baudRate: printer.baudRate || 9600,
    }, (err) => {
      if (err) return reject(new Error(`Serial ${printer.serialPort}: ${err.message}`))
      port.write(Buffer.from(data, 'binary'), (writeErr) => {
        port.close()
        if (writeErr) return reject(new Error(`Serial write: ${writeErr.message}`))
        resolve()
      })
    })
    port.on('error', reject)
  })
}

// ── Connection: USB (OS print queue) ─────────────────────────────────────────
// Windows: sends raw bytes via PowerShell + WinSpool API
// Linux/macOS: uses lpr -P <queue> -l (raw passthrough)

const WINSPOOL_PS = `
param([string]$printerName, [string]$dataFile)
$bytes = [System.IO.File]::ReadAllBytes($dataFile)
Add-Type -TypeDefinition @"
using System;using System.Runtime.InteropServices;
public class WinSpool {
  [DllImport("winspool.drv",CharSet=CharSet.Ansi,SetLastError=true)]
  public static extern bool OpenPrinter(string n,out IntPtr h,IntPtr d);
  [DllImport("winspool.drv",SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv",CharSet=CharSet.Ansi,SetLastError=true)]
  public static extern int StartDocPrinter(IntPtr h,int lv,ref DOCINFO d);
  [DllImport("winspool.drv",SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv",SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr h);
  [DllImport("winspool.drv",SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr h);
  [DllImport("winspool.drv",SetLastError=true)]
  public static extern bool WritePrinter(IntPtr h,IntPtr buf,int cb,out int written);
  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Ansi)] public struct DOCINFO {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDatatype;
  }
}
"@ -ErrorAction Stop
$h=[IntPtr]::Zero
if(-not [WinSpool]::OpenPrinter($printerName,[ref]$h,[IntPtr]::Zero)){throw "OpenPrinter failed: $([System.Runtime.InteropServices.Marshal]::GetLastWin32Error())"}
try {
  $di=New-Object WinSpool+DOCINFO; $di.pDocName="InteliarLabel"; $di.pOutputFile=$null; $di.pDatatype="RAW"
  if([WinSpool]::StartDocPrinter($h,1,[ref]$di) -eq 0){throw "StartDocPrinter failed: $([System.Runtime.InteropServices.Marshal]::GetLastWin32Error())"}
  [WinSpool]::StartPagePrinter($h)|Out-Null
  $ptr=[System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
  [System.Runtime.InteropServices.Marshal]::Copy($bytes,0,$ptr,$bytes.Length)
  $written=0
  [WinSpool]::WritePrinter($h,$ptr,$bytes.Length,[ref]$written)|Out-Null
  [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
  [WinSpool]::EndPagePrinter($h)|Out-Null
  [WinSpool]::EndDocPrinter($h)|Out-Null
  Write-Output "OK:$written"
} finally {
  [WinSpool]::ClosePrinter($h)|Out-Null
}
`

function printViaUsb(data, printer) {
  return new Promise((resolve, reject) => {
    const platform = process.platform
    const queueName = printer.usbQueue || printer.name

    if (platform === 'win32') {
      // Write both the PS script and the raw print data to temp files.
      // Passing data as a command-line arg breaks for large jobs (logos, many
      // labels) with spawn ENAMETOOLONG, since Windows caps argv at ~32k chars.
      // The script reads the bytes from the data file instead.
      const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const tmpScript = path.join(os.tmpdir(), `inteliar_print_${stamp}.ps1`)
      const tmpData = path.join(os.tmpdir(), `inteliar_data_${stamp}.bin`)
      fs.writeFileSync(tmpScript, WINSPOOL_PS, 'utf8')
      fs.writeFileSync(tmpData, Buffer.from(data, 'binary'))
      execFile('powershell', [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
        '-File', tmpScript,
        '-printerName', queueName,
        '-dataFile', tmpData,
      ], { timeout: 30000 }, (err, stdout, stderr) => {
        try { fs.unlinkSync(tmpScript) } catch {}
        try { fs.unlinkSync(tmpData) } catch {}
        if (err) return reject(new Error(`USB WinSpool: ${stderr || err.message}`))
        if (!stdout.includes('OK:')) return reject(new Error(`USB WinSpool: respuesta inesperada: ${stdout}`))
        resolve()
      })
    } else {
      // Linux / macOS: lpr with -l flag for raw passthrough
      const child = exec(`lpr -P "${queueName}" -l`, { timeout: 15000 }, (err, _stdout, stderr) => {
        if (err) return reject(new Error(`USB lpr: ${stderr || err.message}`))
        resolve()
      })
      child.stdin.write(data, 'binary')
      child.stdin.end()
    }
  })
}

// ── Connection: USB via Windows driver (GDI image) ───────────────────────────
// Prints rendered label images THROUGH the printer's Windows driver, exactly
// like the Windows test page. Works with any printer that has a working driver
// (Honeywell/Seagull graphics drivers, etc.) that does NOT interpret raw ZPL.
// Each image is drawn to fill a page sized to the label's physical dimensions.

const IMAGE_PRINT_PS = `
param([string]$printerName,[string]$listFile,[int]$wMm,[int]$hMm,[string]$flip)
Add-Type -AssemblyName System.Drawing
$files = @(Get-Content -LiteralPath $listFile | Where-Object { $_ -ne "" })
if($files.Count -eq 0){ throw "No hay imagenes para imprimir" }
$wHund = [int]([math]::Round($wMm / 25.4 * 100))
$hHund = [int]([math]::Round($hMm / 25.4 * 100))
$pd = New-Object System.Drawing.Printing.PrintDocument
$pd.PrinterSettings.PrinterName = $printerName
if(-not $pd.PrinterSettings.IsValid){ throw "Impresora invalida: $printerName" }
$pd.DocumentName = "InteliarLabel"
$ps = New-Object System.Drawing.Printing.PaperSize("InteliarLabel", $wHund, $hHund)
$pd.DefaultPageSettings.PaperSize = $ps
$pd.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
$pd.OriginAtMargins = $false
$script:idx = 0
$pd.add_PrintPage({
  param($s,$e)
  $img = [System.Drawing.Image]::FromFile($files[$script:idx])
  try {
    if($flip -eq "v"){ $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipY) }
    elseif($flip -eq "h"){ $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
    elseif($flip -eq "both"){ $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipXY) }
    $e.Graphics.DrawImage($img, 0, 0, $e.PageBounds.Width, $e.PageBounds.Height)
  } finally { $img.Dispose() }
  $script:idx++
  $e.HasMorePages = ($script:idx -lt $files.Count)
})
$pd.Print()
Write-Output "OK:$($files.Count)"
`

// flip: 'none' | 'v' (vertical, top<->bottom) | 'h' (horizontal, left<->right) | 'both'
// Some Windows drivers (e.g. Honeywell/Seagull) mirror the page on one axis;
// this lets a printer be configured to compensate without affecting others.
function printImagesViaDriver(images, printer, widthMm, heightMm) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      return reject(new Error('Impresión por driver (imagen) solo disponible en Windows'))
    }
    const queueName = printer.usbQueue || printer.name
    const flip = printer.imageFlip || 'none'
    const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const tmpScript = path.join(os.tmpdir(), `inteliar_img_${stamp}.ps1`)
    const listFile = path.join(os.tmpdir(), `inteliar_list_${stamp}.txt`)
    const imgFiles = []
    try {
      images.forEach((b64, i) => {
        const clean = b64.replace(/^data:image\/\w+;base64,/, '')
        const f = path.join(os.tmpdir(), `inteliar_img_${stamp}_${i}.png`)
        fs.writeFileSync(f, Buffer.from(clean, 'base64'))
        imgFiles.push(f)
      })
      fs.writeFileSync(listFile, imgFiles.join('\r\n'), 'utf8')
      fs.writeFileSync(tmpScript, IMAGE_PRINT_PS, 'utf8')
    } catch (e) {
      return reject(new Error(`No se pudieron preparar las imágenes: ${e.message}`))
    }
    const cleanup = () => {
      try { fs.unlinkSync(tmpScript) } catch {}
      try { fs.unlinkSync(listFile) } catch {}
      imgFiles.forEach((f) => { try { fs.unlinkSync(f) } catch {} })
    }
    execFile('powershell', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', tmpScript,
      '-printerName', queueName,
      '-listFile', listFile,
      '-wMm', String(Math.round(widthMm)),
      '-hMm', String(Math.round(heightMm)),
      '-flip', flip,
    ], { timeout: 60000 }, (err, stdout, stderr) => {
      cleanup()
      if (err) return reject(new Error(`Driver print: ${stderr || err.message}`))
      if (!String(stdout).includes('OK:')) return reject(new Error(`Driver print: respuesta inesperada: ${stdout}`))
      resolve(imgFiles.length)
    })
  })
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

async function doPrint(rawData, printer) {
  const format = detectFormat(rawData)
  const data = prependInit(rawData, printer)
  const labels = countLabels(rawData, format)

  const conn = printer.connection || 'simulate'
  const start = Date.now()

  try {
    if (conn === 'simulate') {
      console.log(`[Agent][simulate] ${labels} etiquetas (${format}) — ${data.length} bytes`)
      console.log(data.substring(0, 300))
    } else if (conn === 'tcp') {
      await printViaTcp(data, printer)
    } else if (conn === 'usb') {
      await printViaUsb(data, printer)
    } else if (conn === 'serial') {
      await printViaSerial(data, printer)
    } else {
      throw new Error(`Tipo de conexión desconocido: ${conn}`)
    }

    const job = {
      printer: printer.id,
      printerName: printer.name,
      labels,
      format,
      bytes: data.length,
      mode: conn,
      durationMs: Date.now() - start,
      status: 'ok',
    }
    logJob(job)
    return job

  } catch (err) {
    const job = {
      printer: printer.id,
      printerName: printer.name,
      labels,
      format,
      bytes: data.length,
      mode: conn,
      durationMs: Date.now() - start,
      status: 'error',
      error: err.message,
    }
    logJob(job)
    throw err
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/status', (_req, res) => {
  const def = config.printers.find(p => p.id === config.defaultPrinterId)
  res.json({
    service: 'inteliar-printer-agent',
    version: '2.0.0',
    status: 'running',
    defaultPrinter: def || null,
    printerCount: config.printers.length,
    totalJobs: printLog.length,
    platform: process.platform,
  })
})

app.get('/printers', (_req, res) => {
  res.json(config.printers)
})

app.post('/printers', (req, res) => {
  const p = req.body
  if (!p.id || !p.name || !p.connection) {
    return res.status(400).json({ error: 'Faltan campos requeridos: id, name, connection' })
  }
  const idx = config.printers.findIndex(x => x.id === p.id)
  if (idx >= 0) {
    config.printers[idx] = p
  } else {
    config.printers.push(p)
    if (config.printers.length === 1) config.defaultPrinterId = p.id
  }
  saveConfig(config)
  res.json({ success: true, printer: p })
})

app.delete('/printers/:id', (req, res) => {
  const { id } = req.params
  const before = config.printers.length
  config.printers = config.printers.filter(p => p.id !== id)
  if (config.defaultPrinterId === id) {
    config.defaultPrinterId = config.printers[0]?.id || null
  }
  saveConfig(config)
  res.json({ success: config.printers.length < before })
})

app.post('/printers/:id/default', (req, res) => {
  const { id } = req.params
  if (!config.printers.find(p => p.id === id)) {
    return res.status(404).json({ error: 'Impresora no encontrada' })
  }
  config.defaultPrinterId = id
  saveConfig(config)
  res.json({ success: true, defaultPrinterId: id })
})

app.post('/printers/:id/test', async (req, res) => {
  const printer = config.printers.find(p => p.id === req.params.id)
  if (!printer) return res.status(404).json({ error: 'Impresora no encontrada' })

  const lang = printer.language || 'zpl'
  const testLabel = lang === 'tspl'
    ? `SIZE 50 mm, 30 mm\r\nGAP 2 mm, 0\r\nCLS\r\nTEXT 10,10,"3",0,1,1,"Inteliar Test"\r\nPRINT 1\r\n`
    : `^XA^PW400^LL240^FO20,20^A0N,30,24^FDInteliar Test^FS^FO20,60^A0N,20,16^FD${printer.name}^FS^PQ1^XZ`

  try {
    const job = await doPrint(testLabel, printer)
    res.json({ success: true, job })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Print rendered label images through the Windows driver (GDI).
// Body: { images: [base64Png, ...], widthMm, heightMm }
// Used for printers whose driver does not interpret raw ZPL.
async function handlePrintImage(printer, req, res) {
  if (!printer) return res.status(404).json({ error: 'Impresora no encontrada' })
  const { images, widthMm, heightMm } = req.body || {}
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Faltan imágenes (campo images)' })
  }
  if (!widthMm || !heightMm) {
    return res.status(400).json({ error: 'Faltan dimensiones (widthMm, heightMm)' })
  }
  const start = Date.now()
  try {
    const count = await printImagesViaDriver(images, printer, widthMm, heightMm)
    const job = {
      printer: printer.id, printerName: printer.name, labels: count,
      format: 'image', bytes: 0, mode: 'driver',
      durationMs: Date.now() - start, status: 'ok',
    }
    logJob(job)
    res.json({ success: true, ...job })
  } catch (err) {
    logJob({
      printer: printer.id, printerName: printer.name, labels: images.length,
      format: 'image', bytes: 0, mode: 'driver',
      durationMs: Date.now() - start, status: 'error', error: err.message,
    })
    res.status(500).json({ success: false, error: err.message })
  }
}

app.post('/print-image', (req, res) => {
  const printer = config.printers.find(p => p.id === config.defaultPrinterId)
  return handlePrintImage(printer, req, res)
})

app.post('/print-image/:id', (req, res) => {
  const printer = config.printers.find(p => p.id === req.params.id)
  return handlePrintImage(printer, req, res)
})

// Discover USB/OS print queues
app.get('/discover/usb', (_req, res) => {
  const platform = process.platform
  if (platform === 'win32') {
    exec('powershell -NoProfile -NonInteractive -Command "Get-Printer | Select-Object Name,DriverName,PortName | ConvertTo-Json"',
      { timeout: 8000 }, (err, stdout) => {
        if (err) return res.status(500).json({ error: err.message })
        try {
          const printers = JSON.parse(stdout)
          res.json(Array.isArray(printers) ? printers : [printers])
        } catch {
          res.json([])
        }
      })
  } else {
    exec('lpstat -p 2>/dev/null || echo ""', { timeout: 5000 }, (err, stdout) => {
      const printers = stdout.split('\n')
        .filter(l => l.startsWith('printer '))
        .map(l => ({ Name: l.split(' ')[1] }))
      res.json(printers)
    })
  }
})

// Discover network printers (ping-scan common ports on local subnet)
app.get('/discover/network', (req, res) => {
  const subnet = req.query.subnet || '192.168.1'
  const port = parseInt(req.query.port || '9100', 10)
  const found = []
  let pending = 0
  let done = false

  const check = (ip) => {
    pending++
    const s = new net.Socket()
    s.setTimeout(800)
    s.connect(port, ip, () => {
      found.push({ ip, port, status: 'open' })
      s.destroy()
    })
    s.on('error', () => s.destroy())
    s.on('timeout', () => s.destroy())
    s.on('close', () => {
      pending--
      if (pending === 0 && done) res.json(found)
    })
  }

  for (let i = 1; i <= 254; i++) check(`${subnet}.${i}`)
  done = true
  if (pending === 0) res.json(found)
})

// Print to default printer
app.post('/print', async (req, res) => {
  const { data, printerId } = req.body
  if (!data) return res.status(400).json({ error: 'Campo data requerido' })

  const id = printerId || config.defaultPrinterId
  const printer = config.printers.find(p => p.id === id)
  if (!printer) return res.status(404).json({ error: `Impresora '${id}' no configurada` })

  try {
    const job = await doPrint(data, printer)
    res.json({ success: true, ...job })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Print to specific printer
app.post('/print/:id', async (req, res) => {
  const { data } = req.body
  if (!data) return res.status(400).json({ error: 'Campo data requerido' })

  const printer = config.printers.find(p => p.id === req.params.id)
  if (!printer) return res.status(404).json({ error: 'Impresora no encontrada' })

  try {
    const job = await doPrint(data, printer)
    res.json({ success: true, ...job })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/log', (_req, res) => {
  res.json([...printLog].reverse().slice(0, 100))
})

// ── Start ─────────────────────────────────────────────────────────────────────

async function start() {
  // When launched by the Electron desktop wrapper, license is validated there.
  if (process.env.SKIP_LICENSE_CHECK !== '1') {
    await ensureLicense()
  } else {
    console.log('[Licencia] Validación delegada a la app de escritorio.')
  }

  app.listen(PORT, () => {
    console.log(`[Printer Agent] Inteliar Printer Agent v2 — http://localhost:${PORT}`)
    console.log(`[Printer Agent] Impresoras configuradas: ${config.printers.length}`)
    config.printers.forEach(p => {
      const detail = p.connection === 'tcp' ? ` ${p.host}:${p.port || 9100}`
        : p.connection === 'usb' ? ` (${p.usbQueue || p.name})`
        : p.connection === 'serial' ? ` ${p.serialPort}`
        : ' (simulación)'
      console.log(`  • [${p.id}] ${p.name} — ${p.connection}${detail}${p.id === config.defaultPrinterId ? ' ✓ default' : ''}`)
    })
  })
}

start()
