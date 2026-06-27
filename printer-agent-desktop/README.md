# Inteliar Printer Agent — Desktop (Electron)

Aplicación de escritorio que envuelve el agente de impresión con:

- 🟢 **Ícono en la bandeja del sistema** (verde = activo, gris = detenido, rojo = error)
- 🔑 **Activación con clave de licencia** al primer arranque
- 🚀 **Arranque automático** con Windows
- 🖨 **Configuración de impresoras** desde la web (`localhost:9638`)
- 📋 **Ventana de estado** con plan, dispositivos y controles

## Arquitectura

```
Electron (src/main.js)
  ├── Tray icon + menú contextual
  ├── Ventana de activación (renderer/activation.html)
  ├── Ventana de estado (renderer/status.html)
  └── lanza el agente Express como proceso hijo
        (../printer-agent/src/index.js, con SKIP_LICENSE_CHECK=1)
```

La validación de licencia la hace Electron (no el agente), contra
`POST /api/license/validate` en el servidor.

## Desarrollo

```bash
# Primero instalá las deps del agente
cd ../printer-agent && npm install

# Luego las del desktop
cd ../printer-agent-desktop && npm install

# Correr en modo dev (usa el agente de ../printer-agent/src)
npm run dev
```

## Build del instalador

```bash
npm run build:win    # genera dist/Inteliar Printer Agent Setup X.X.X.exe
```

El CI (`.github/workflows/build-desktop.yml`) lo construye automáticamente
en `windows-latest` y publica el instalador como Release en `main`.

## Datos del usuario

Se guardan en `%APPDATA%/inteliar-printer-agent-desktop/`:
- `license.json` — clave, device_id, plan, última validación
- `printers.json` — impresoras configuradas
