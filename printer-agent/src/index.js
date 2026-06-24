import express from 'express';
import cors from 'cors';
import net from 'net';
import { exec } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const app = express();
const PORT = process.env.AGENT_PORT || 9638;

const PRINTER_TYPE = process.env.PRINTER_TYPE || 'tcp'; // 'tcp' | 'usb'
const PRINTER_IP = process.env.PRINTER_IP || '127.0.0.1';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100', 10);
const PRINTER_NAME = process.env.PRINTER_NAME || 'Honeywell PC42t plus (203 dpi)';
const SIMULATE = process.env.SIMULATE !== 'false';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let lastPrintJob = null;
let printCount = 0;
const printLog = [];

app.get('/status', (req, res) => {
  res.json({
    service: 'inteliar-printer-agent',
    status: 'running',
    printer: {
      type: PRINTER_TYPE,
      ip: PRINTER_TYPE === 'tcp' ? PRINTER_IP : null,
      port: PRINTER_TYPE === 'tcp' ? PRINTER_PORT : null,
      name: PRINTER_TYPE === 'usb' ? PRINTER_NAME : null,
      simulate: SIMULATE
    },
    stats: { totalJobs: printCount, lastJob: lastPrintJob }
  });
});

app.post('/print', async (req, res) => {
  const { type, data } = req.body;

  if (!data) {
    return res.status(400).json({ success: false, message: 'No se recibio data' });
  }

  const isZPL = data.includes('^XA');
  const isTSPL = data.includes('SIZE ') || data.includes('TEXT ') || data.includes('BARCODE ');
  const format = type || (isZPL ? 'zpl' : isTSPL ? 'tspl' : 'raw');

  let labelCount = 0;
  if (format === 'zpl') labelCount = (data.match(/\^XA/g) || []).length;
  else if (format === 'tspl') labelCount = (data.match(/PRINT\s+\d+/g) || []).length;

  console.log(`[Agent] Job: ${labelCount} labels, ${format}, ${data.length} bytes`);

  try {
    if (SIMULATE) {
      console.log(`[Agent] SIMULATION - ${labelCount} labels`);
      console.log(data.substring(0, 500));
      lastPrintJob = { timestamp: new Date().toISOString(), labels: labelCount, mode: 'simulate', format, bytes: data.length, status: 'ok' };
      printCount++;
      printLog.push(lastPrintJob);
      return res.json({ success: true, message: `Simulacion OK: ${labelCount} etiquetas (${format.toUpperCase()})`, labels: labelCount, mode: 'simulate', format });
    }

    let printData = data;
    if (format === 'tspl') printData = '\x1b!R\r\nSET CUTTER OFF\r\n' + data;

    const mode = PRINTER_TYPE === 'usb' ? 'usb' : 'tcp';
    if (PRINTER_TYPE === 'usb') {
      await sendToWindowsPrinter(printData, PRINTER_NAME);
    } else {
      await sendToTCP(printData);
    }

    lastPrintJob = {
      timestamp: new Date().toISOString(), labels: labelCount, mode, format,
      printer: PRINTER_TYPE === 'usb' ? PRINTER_NAME : `${PRINTER_IP}:${PRINTER_PORT}`,
      bytes: printData.length, status: 'ok'
    };
    printCount++;
    printLog.push(lastPrintJob);
    res.json({ success: true, message: `Impreso: ${labelCount} etiquetas (${format.toUpperCase()}) via ${mode.toUpperCase()}`, labels: labelCount, mode, format });

  } catch (err) {
    console.error(`[Agent] Error:`, err.message);
    lastPrintJob = { timestamp: new Date().toISOString(), labels: labelCount, format, status: 'error', error: err.message };
    printLog.push(lastPrintJob);
    res.status(500).json({ success: false, message: `Error: ${err.message}`, labels: labelCount, format });
  }
});

app.get('/log', (req, res) => {
  res.json(printLog.slice(-100).reverse());
});

// USB: write PS1 script to temp file and run it (avoids inline escaping issues)
function sendToWindowsPrinter(data, printerName) {
  return new Promise((resolve, reject) => {
    const id = Date.now();
    const dataFile = join(tmpdir(), `inteliar_${id}.zpl`);
    const psFile = join(tmpdir(), `inteliar_${id}.ps1`);

    writeFileSync(dataFile, data, 'binary');

    const psScript = `
$ErrorActionPreference = 'Stop'
$dataFile = '${dataFile.replace(/\\/g, '\\\\')}'
$printerName = '${printerName.replace(/'/g, "''")}'

$bytes = [System.IO.File]::ReadAllBytes($dataFile)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinSpool {
    [DllImport("winspool.drv", CharSet=CharSet.Ansi, SetLastError=true)]
    public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr h);
    [DllImport("winspool.drv", CharSet=CharSet.Ansi, SetLastError=true)]
    public static extern int StartDocPrinter(IntPtr h, int l, ref DOCINFO d);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr h, IntPtr b, int c, out int w);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public struct DOCINFO {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
}
"@

$h = [IntPtr]::Zero
if (-not [WinSpool]::OpenPrinter($printerName, [ref]$h, [IntPtr]::Zero)) {
    throw "No se pudo abrir la impresora: $printerName"
}
try {
    $di = New-Object WinSpool+DOCINFO
    $di.pDocName = 'InteliarLabel'
    $di.pDataType = 'RAW'
    [WinSpool]::StartDocPrinter($h, 1, [ref]$di) | Out-Null
    [WinSpool]::StartPagePrinter($h) | Out-Null
    $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
    $written = 0
    [WinSpool]::WritePrinter($h, $ptr, $bytes.Length, [ref]$written) | Out-Null
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
    [WinSpool]::EndPagePrinter($h) | Out-Null
    [WinSpool]::EndDocPrinter($h) | Out-Null
    Write-Output "OK:$written"
} finally {
    [WinSpool]::ClosePrinter($h) | Out-Null
}
`;

    writeFileSync(psFile, psScript, 'utf8');

    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${psFile}"`,
      { timeout: 20000 },
      (err, stdout, stderr) => {
        try { unlinkSync(dataFile); } catch (_) {}
        try { unlinkSync(psFile); } catch (_) {}
        if (err) {
          reject(new Error(stderr.trim() || err.message));
        } else {
          console.log(`[Agent] USB: ${stdout.trim()}`);
          resolve();
        }
      }
    );
  });
}

function sendToTCP(data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = setTimeout(() => { client.destroy(); reject(new Error(`Timeout ${PRINTER_IP}:${PRINTER_PORT}`)); }, 10000);
    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      clearTimeout(timeout);
      client.write(data, () => { client.end(); resolve(); });
    });
    client.on('error', (err) => { clearTimeout(timeout); reject(new Error(`TCP ${PRINTER_IP}:${PRINTER_PORT} - ${err.message}`)); });
  });
}

app.listen(PORT, () => {
  console.log(`[Printer Agent] Running on http://localhost:${PORT}`);
  console.log(`[Printer Agent] Mode: ${SIMULATE ? 'SIMULATION' : 'PRODUCTION'}`);
  if (!SIMULATE) {
    if (PRINTER_TYPE === 'usb') console.log(`[Printer Agent] USB printer: ${PRINTER_NAME}`);
    else console.log(`[Printer Agent] TCP: ${PRINTER_IP}:${PRINTER_PORT}`);
  }
});
