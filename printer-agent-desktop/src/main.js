const { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain, dialog, Notification } = require('electron')
const path = require('path')
const { fork, spawn } = require('child_process')
const fs = require('fs')
const { randomUUID } = require('crypto')
const os = require('os')

// ── Paths ─────────────────────────────────────────────────────────────────────

const isDev = process.argv.includes('--dev')
const DATA_DIR = app.getPath('userData')
const LICENSE_FILE = path.join(DATA_DIR, 'license.json')
const CONFIG_FILE = path.join(DATA_DIR, 'printers.json')

// Agent source: in dev, use printer-agent/src; in prod, use resources/agent/src
const AGENT_ENTRY = isDev
  ? path.join(__dirname, '../../printer-agent/src/index.js')
  : path.join(process.resourcesPath, 'agent', 'src', 'index.js')

const LICENSE_SERVER = process.env.LICENSE_SERVER || 'https://v0-inteliar-labels-ui.vercel.app'
const PORT = 9638

// ── State ─────────────────────────────────────────────────────────────────────

let tray = null
let statusWindow = null
let activationWindow = null
let agentProcess = null
let agentStatus = 'stopped' // stopped | starting | running | error
let agentError = null
let licenseInfo = null

// ── License helpers ───────────────────────────────────────────────────────────

function getDeviceId() {
  const data = loadLicense()
  if (data.device_id) return data.device_id
  const id = randomUUID()
  saveLicense({ device_id: id })
  return id
}

function loadLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE)) return JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf8'))
  } catch {}
  return {}
}

function saveLicense(patch) {
  const current = loadLicense()
  fs.writeFileSync(LICENSE_FILE, JSON.stringify({ ...current, ...patch }, null, 2))
}

async function validateLicense(key) {
  const deviceId = getDeviceId()
  try {
    const res = await fetch(`${LICENSE_SERVER}/api/license/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, device_id: deviceId, hostname: os.hostname() }),
      signal: AbortSignal.timeout(10000),
    })
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      // Server returned HTML/text (wrong URL, 404, Vercel error page, etc.)
      return { valid: false, message: `El servidor de licencias no respondió correctamente (HTTP ${res.status}). Verificá tu conexión.` }
    }
  } catch (e) {
    return { valid: false, message: `Sin conexión: ${e.message}` }
  }
}

async function checkLicense() {
  const stored = loadLicense()
  if (!stored.key) return { valid: false, needsActivation: true }

  const result = await validateLicense(stored.key)

  if (result.valid) {
    saveLicense({ plan: result.plan, validated_at: new Date().toISOString() })
    licenseInfo = { key: stored.key, plan: result.plan, devices_used: result.devices_used, max_devices: result.max_devices }
    return { valid: true }
  }

  // Network error — grace period
  if (result.message?.includes('Sin conexión') && stored.validated_at) {
    const days = (Date.now() - new Date(stored.validated_at).getTime()) / 86400000
    if (days <= 7) {
      licenseInfo = { key: stored.key, plan: stored.plan, offline: true, graceDays: Math.ceil(days) }
      return { valid: true, offline: true }
    }
    return { valid: false, message: 'Sin conexión por más de 7 días. Reconectate para continuar.' }
  }

  return { valid: false, message: result.message, needsActivation: result.message?.includes('no encontrada') }
}

// ── Agent process ─────────────────────────────────────────────────────────────

function startAgent() {
  if (agentProcess) return
  agentStatus = 'starting'
  agentError = null
  updateTray()

  // Pass config path so agent stores printers.json in user data dir.
  // ELECTRON_RUN_AS_NODE makes the Electron binary behave like plain Node,
  // so we can run the agent's ESM entry point without bundling a separate Node.
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    AGENT_PORT: String(PORT),
    CONFIG_PATH: CONFIG_FILE,
    LICENSE_SERVER,
    SKIP_LICENSE_CHECK: '1', // Electron handles license; agent skips its own check
  }

  agentProcess = spawn(process.execPath, [AGENT_ENTRY], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  agentProcess.stdout.on('data', (d) => {
    const line = d.toString().trim()
    console.log('[Agent]', line)
    if (line.includes('http://localhost')) {
      agentStatus = 'running'
      updateTray()
      showNotification('Inteliar Label', 'Agente iniciado correctamente ✓')
    }
  })

  agentProcess.stderr.on('data', (d) => {
    const line = d.toString().trim()
    console.error('[Agent ERR]', line)
    if (line.includes('EADDRINUSE') || line.includes('address already in use')) {
      agentError = `El puerto ${PORT} ya está en uso. Cerrá cualquier versión anterior del agente (revisá la bandeja del sistema y el Administrador de tareas) y reiniciá.`
    } else if (line) {
      agentError = line.slice(0, 200)
    }
  })

  agentProcess.on('exit', (code) => {
    console.log('[Agent] Proceso terminado, código:', code)
    agentProcess = null
    agentStatus = code === 0 ? 'stopped' : 'error'
    updateTray()
  })

  agentProcess.on('error', (err) => {
    console.error('[Agent] No se pudo iniciar:', err.message)
    agentError = `No se pudo iniciar el agente: ${err.message}`
    agentStatus = 'error'
    updateTray()
  })
}

function stopAgent() {
  if (agentProcess) {
    agentProcess.kill()
    agentProcess = null
  }
  agentStatus = 'stopped'
  updateTray()
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function getTrayIcon() {
  // Use a simple colored circle icon based on status
  const iconPath = path.join(__dirname, '../assets', `icon-${agentStatus === 'running' ? 'green' : agentStatus === 'error' ? 'red' : 'gray'}.png`)
  if (fs.existsSync(iconPath)) return nativeImage.createFromPath(iconPath)
  // Fallback to default icon
  const defaultIcon = path.join(__dirname, '../assets/icon.png')
  if (fs.existsSync(defaultIcon)) return nativeImage.createFromPath(defaultIcon)
  return nativeImage.createEmpty()
}

function updateTray() {
  if (!tray) return

  const statusLabel = {
    stopped: '⚫ Detenido',
    starting: '🟡 Iniciando...',
    running: '🟢 Activo',
    error: '🔴 Error',
  }[agentStatus]

  const planLabel = licenseInfo
    ? licenseInfo.plan === 'lifetime' ? 'De por vida' : 'Mensual'
    : ''

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Inteliar Label', enabled: false },
    { label: statusLabel, enabled: false },
    ...(licenseInfo ? [{ label: `Plan: ${planLabel}`, enabled: false }] : []),
    ...(licenseInfo?.offline ? [{ label: `⚠ Modo offline (${licenseInfo.graceDays}d/7d)`, enabled: false }] : []),
    { type: 'separator' },
    {
      label: '🖨 Abrir configuración',
      click: () => shell.openExternal(`http://localhost:${PORT}`),
      enabled: agentStatus === 'running',
    },
    {
      label: agentStatus === 'running' ? '⏹ Detener agente' : '▶ Iniciar agente',
      click: () => agentStatus === 'running' ? stopAgent() : startAgent(),
    },
    { type: 'separator' },
    {
      label: '📋 Ver estado',
      click: () => openStatusWindow(),
    },
    {
      label: '🔑 Cambiar licencia',
      click: () => openActivationWindow(true),
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        stopAgent()
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip(`Inteliar Label — ${statusLabel}`)
}

// ── Windows ───────────────────────────────────────────────────────────────────

function openActivationWindow(force = false) {
  if (activationWindow) { activationWindow.focus(); return }

  activationWindow = new BrowserWindow({
    width: 480,
    height: 380,
    resizable: false,
    title: 'Inteliar Label — Activación',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  })

  activationWindow.loadFile(path.join(__dirname, '../renderer/activation.html'))
  activationWindow.on('closed', () => { activationWindow = null })

  if (!force) {
    // If user closes without activating, quit
    activationWindow.on('close', (e) => {
      if (!loadLicense().key) {
        stopAgent()
        app.quit()
      }
    })
  }
}

function openStatusWindow() {
  if (statusWindow) { statusWindow.focus(); return }

  statusWindow = new BrowserWindow({
    width: 420,
    height: 500,
    resizable: false,
    title: 'Inteliar Label — Estado',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  })

  statusWindow.loadFile(path.join(__dirname, '../renderer/status.html'))
  statusWindow.on('closed', () => { statusWindow = null })
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('activate-license', async (_e, key) => {
  const result = await validateLicense(key)
  if (result.valid) {
    saveLicense({ key, plan: result.plan, validated_at: new Date().toISOString() })
    licenseInfo = { key, plan: result.plan, devices_used: result.devices_used, max_devices: result.max_devices }
    updateTray()
    startAgent()
    if (activationWindow) activationWindow.close()
  }
  return result
})

ipcMain.handle('get-status', () => ({
  agentStatus,
  agentError,
  licenseInfo,
  port: PORT,
  version: app.getVersion(),
}))

ipcMain.handle('open-config', () => {
  // Printer configuration lives in the web app (Settings page), not the agent.
  shell.openExternal(`${LICENSE_SERVER}/settings`)
})

ipcMain.handle('restart-agent', () => {
  stopAgent()
  setTimeout(startAgent, 1000)
})

// ── Notifications ─────────────────────────────────────────────────────────────

function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, '../assets/icon.png') }).show()
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.setAppUserModelId('com.inteliar.printer-agent')

// Single instance
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.on('second-instance', () => {
  openStatusWindow()
})

app.whenReady().then(async () => {
  // Hide from dock/taskbar — lives in tray only
  if (app.dock) app.dock.hide()

  // Create tray
  tray = new Tray(getTrayIcon())
  tray.setToolTip('Inteliar Label')
  tray.on('click', () => openStatusWindow())
  updateTray()

  // Check license
  const licenseCheck = await checkLicense()

  if (!licenseCheck.valid) {
    if (licenseCheck.needsActivation || !loadLicense().key) {
      openActivationWindow(false)
    } else {
      dialog.showErrorBox(
        'Inteliar Label — Licencia inválida',
        licenseCheck.message || 'Licencia no válida. Contactá soporte.'
      )
      app.quit()
    }
    return
  }

  // License OK — start agent
  startAgent()

  // Auto-start on login
  app.setLoginItemSettings({
    openAtLogin: true,
    name: 'Inteliar Label',
  })
})

app.on('window-all-closed', (e) => {
  // Don't quit when all windows close — keep tray alive
  e.preventDefault()
})

app.on('before-quit', () => {
  stopAgent()
})
