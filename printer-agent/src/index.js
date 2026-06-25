const express = require('express');
const cors = require('cors');
const net = require('net');
const { exec } = require('child_process');
const { writeFileSync, unlinkSync, existsSync, readFileSync } = require('fs');
const { tmpdir } = require('os');
const { join, dirname } = require('path');

// Read config from config.json next to the exe (or in cwd for dev)
function loadConfig() {
  const locations = [
    join(dirname(process.execPath), 'config.json'),
    join(process.cwd(), 'config.json'),
  ];
  for (const loc of locations) {
    if (existsSync(loc)) {
      try { return JSON.parse(readFileSync(loc, 'utf8')); } catch (_) {}
    }
  }
  return {};
}

const cfg = loadConfig();

const PORT        = cfg.agentPort    || process.env.AGENT_PORT    || 9638;
const PRINTER_TYPE  = cfg.printerType  || process.env.PRINTER_TYPE  || 'usb';
const PRINTER_IP    = cfg.printerIp    || process.env.PRINTER_IP    || '127.0.0.1';
const PRINTER_PORT  = cfg.printerPort  || process.env.PRINTER_PORT  || 9100;
const PRINTER_NAME  = cfg.printerName  || process.env.PRINTER_NAME  || 'Honeywell PC42t plus (203 dpi)';
const SIMULATE      = cfg.simulate !== undefined
  ? cfg.simulate
  : process.env.SIMULATE !== 'false';

const app = express();
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
      simulate: SIMULATE,
    },
    stats: { totalJobs: printCount, lastJob: lastPrintJob },
  });
});

app.post('/print', async (req, res) => {
  const { type, data } = req.body;
  if (!data) return res.status(400).json({ success: false, message: 'No se recibio data' });

  const isZPL  = data.includes('^XA');
  const isTSPL = data.includes('SIZE ') || data.includes('TEXT ') || data.includes('BARCODE ');
  const format = type || (isZPL ? 'zpl' : isTSPL ? 'tspl' : 'raw');

  let labelCount = 0;
  if (format === 'zpl')  labelCount = (data.match(/\^XA/g) || []).length;
  if (format === 'tspl') labelCount = (data.match(/PRINT\s+\d+/g) || []).length;

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

    if (PRINTER_TYPE === 'usb') {
      await sendToWindowsPrinter(printData, PRINTER_NAME);
    } else {
      await sendToTCP(printData);
    }

    const mode = PRINTER_TYPE === 'usb' ? 'usb' : 'tcp';
    lastPrintJob = {
      timestamp: new Date().toISOString(), labels: labelCount, mode, format,
      printer: PRINTER_TYPE === 'usb' ? PRINTER_NAME : `${PRINTER_IP}:${PRINTER_PORT}`,
      bytes: printData.length, status: 'ok',
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

function sendToWindowsPrinter(data, printerName) {
  return new Promise((resolve, reject) => {
    const id = Date.now();
    const dataFile = join(tmpdir(), `inteliar_${id}.zpl`);
    const psFile   = join(tmpdir(), `inteliar_${id}.ps1`);

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
        if (err) reject(new Error(stderr.trim() || err.message));
        else { console.log(`[Agent] USB: ${stdout.trim()}`); resolve(); }
      }
    );
  });
}

function sendToTCP(data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = setTimeout(() => { client.destroy(); reject(new Error(`Timeout ${PRINTER_IP}:${PRINTER_PORT}`)); }, 10000);
    client.connect(Number(PRINTER_PORT), PRINTER_IP, () => {
      clearTimeout(timeout);
      client.write(data, () => { client.end(); resolve(); });
    });
    client.on('error', (err) => { clearTimeout(timeout); reject(new Error(`TCP ${PRINTER_IP}:${PRINTER_PORT} - ${err.message}`)); });
  });
}

const server = app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   Inteliar Printer Agent  v1.0       ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log(`  Puerto:    http://localhost:${PORT}`);
  console.log(`  Modo:      ${SIMULATE ? 'SIMULACION (no imprime)' : 'PRODUCCION'}`);
  if (!SIMULATE) {
    if (PRINTER_TYPE === 'usb') console.log(`  Impresora: ${PRINTER_NAME}`);
    else console.log(`  TCP:       ${PRINTER_IP}:${PRINTER_PORT}`);
  }
  console.log('');
  console.log('  Agente listo. No cierres esta ventana.');
  console.log('');
});

server.on('error', (err) => {
  console.log('');
  if (err.code === 'EADDRINUSE') {
    console.log('  ════════════════════════════════════════');
    console.log(`  El agente YA ESTA CORRIENDO en el puerto ${PORT}.`);
    console.log('  No necesitas abrirlo de nuevo: ya esta activo.');
    console.log('');
    console.log('  Si crees que es un error, cerra el otro agente');
    console.log('  o reinicia la PC y volve a abrir este programa.');
    console.log('  ════════════════════════════════════════');
  } else {
    console.log(`  Error al iniciar el agente: ${err.message}`);
  }
  console.log('');
  console.log('  Presiona ENTER para cerrar...');
  process.stdin.resume();
  process.stdin.once('data', () => process.exit(1));
});
