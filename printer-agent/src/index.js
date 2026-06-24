import express from 'express';
import cors from 'cors';
import net from 'net';

/**
 * Inteliar Printer Agent
 * Local bridge between the SaaS and thermal printers.
 *
 * Based on labelctl (mherrera53/labelctl) architecture:
 * - HTTP API on port 9638
 * - Receives ZPL or TSPL2 commands
 * - Sends to printer via TCP (network) or simulation mode
 * - Supports Honeywell PC42, TSC, Zebra printers
 */

const app = express();
const PORT = process.env.AGENT_PORT || 9638;

const PRINTER_IP = process.env.PRINTER_IP || '127.0.0.1';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100', 10);
const SIMULATE = process.env.SIMULATE !== 'false'; // true by default in dev

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let lastPrintJob = null;
let printCount = 0;
const printLog = [];

app.get('/status', (req, res) => {
  res.json({
    service: 'inteliar-printer-agent',
    status: 'running',
    printer: { ip: PRINTER_IP, port: PRINTER_PORT, simulate: SIMULATE },
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
  if (format === 'zpl') {
    labelCount = (data.match(/\^XA/g) || []).length;
  } else if (format === 'tspl') {
    labelCount = (data.match(/PRINT\s+\d+/g) || []).length;
  }

  console.log(`[Agent] Job received: ${labelCount} labels, format: ${format}, ${data.length} bytes`);

  try {
    if (SIMULATE) {
      console.log(`[Agent] SIMULATION - ${labelCount} labels processed`);
      console.log(`[Agent] Preview (first 500 chars):\n${data.substring(0, 500)}`);

      lastPrintJob = {
        timestamp: new Date().toISOString(),
        labels: labelCount,
        mode: 'simulate',
        format,
        bytes: data.length,
        status: 'ok'
      };
      printCount++;
      printLog.push(lastPrintJob);

      return res.json({
        success: true,
        message: `Simulacion OK: ${labelCount} etiquetas (${format.toUpperCase()})`,
        labels: labelCount,
        mode: 'simulate',
        format
      });
    }

    let printData = data;
    if (format === 'tspl') {
      const tsplInit = '\x1b!R\r\nSET CUTTER OFF\r\n';
      printData = tsplInit + data;
    }

    await sendToPrinter(printData);

    lastPrintJob = {
      timestamp: new Date().toISOString(),
      labels: labelCount,
      mode: 'tcp',
      format,
      printer: `${PRINTER_IP}:${PRINTER_PORT}`,
      bytes: printData.length,
      status: 'ok'
    };
    printCount++;
    printLog.push(lastPrintJob);

    res.json({
      success: true,
      message: `Impreso: ${labelCount} etiquetas en ${PRINTER_IP}:${PRINTER_PORT} (${format.toUpperCase()})`,
      labels: labelCount,
      mode: 'tcp',
      format
    });
  } catch (err) {
    console.error(`[Agent] Print error:`, err.message);
    lastPrintJob = {
      timestamp: new Date().toISOString(),
      labels: labelCount,
      format,
      status: 'error',
      error: err.message
    };
    printLog.push(lastPrintJob);

    res.status(500).json({
      success: false,
      message: `Error de impresion: ${err.message}`,
      labels: labelCount,
      format
    });
  }
});

app.get('/log', (req, res) => {
  res.json(printLog.slice(-100).reverse());
});

// TCP printer communication (from labelctl batch.go networkRawPrint)
function sendToPrinter(data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error(`Timeout conectando a ${PRINTER_IP}:${PRINTER_PORT}`));
    }, 10000);

    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      clearTimeout(timeout);
      client.write(data, () => {
        client.end();
        resolve();
      });
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`No se pudo conectar a ${PRINTER_IP}:${PRINTER_PORT} - ${err.message}`));
    });
  });
}

app.listen(PORT, () => {
  console.log(`[Printer Agent] Inteliar Printer Agent on http://localhost:${PORT}`);
  console.log(`[Printer Agent] Mode: ${SIMULATE ? 'SIMULATION' : 'PRODUCTION'}`);
  if (!SIMULATE) {
    console.log(`[Printer Agent] Printer: ${PRINTER_IP}:${PRINTER_PORT}`);
  }
});
