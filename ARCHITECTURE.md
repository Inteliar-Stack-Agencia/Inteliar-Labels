# Arquitectura Técnica — Inteliar Labels

## Visión General

Inteliar Labels es una plataforma SaaS para diseño y impresión masiva de etiquetas térmicas. Se compone de dos partes:

1. **Next.js App** (este repo) — frontend SaaS + API routes en la nube o local
2. **Printer Agent** (carpeta `printer-agent/`) — proceso Node.js que corre localmente en el cliente, hace de bridge HTTP→TCP hacia la impresora física

## Stack Tecnológico

| Capa | Tecnología | Notas |
|------|------------|-------|
| Framework | Next.js 16 (App Router) + TypeScript | |
| UI | React 19, TailwindCSS v4, shadcn/ui | |
| Editor visual | Konva.js | drag & drop, canvas |
| ZPL (visual editor) | `lib/zpl.ts` | generación client-side |
| ZPL/TSPL2 (field templates) | `lib/generators/` | generación server-side |
| Excel | SheetJS (xlsx) | client y server-side |
| Auth + DB | Supabase | JWT, RLS |
| IA | Anthropic SDK | generación de templates |
| Printer Agent | Node.js + Express | proceso local, puerto 9638 |

## Diagrama de Arquitectura

```
┌─────────────────────────────────┐
│     Navegador (React / Next.js) │
│                                 │
│  Editor Konva → lib/zpl.ts      │
│  Upload Excel → lib/generators/ │
│  lib/printer-agent-client.ts ───┼──────┐
└──────────────┬──────────────────┘      │
               │ HTTPS                   │ HTTP localhost:9638
               ▼                         ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│  Next.js API Routes     │   │  Printer Agent (local)   │
│  /api/generate          │   │  printer-agent/src/      │
│  /api/print ────────────┼──▶│  POST /print             │
│  /api/presets           │   │  GET  /status            │
│  /api/label-templates   │   │  GET  /log               │
└─────────────┬───────────┘   └──────────┬───────────────┘
              │                           │ TCP 9100
              ▼                           ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│  Supabase               │   │  Impresora Térmica       │
│  Auth + PostgreSQL      │   │  (Honeywell, Zebra, TSC) │
└─────────────────────────┘   └──────────────────────────┘
```

**Nota sobre despliegue:** Cuando Next.js está en Vercel (cloud), la API route `/api/print` no puede alcanzar `localhost:9638`. En ese caso, el frontend llama al printer-agent directamente desde el navegador usando `lib/printer-agent-client.ts`. El printer-agent expone CORS abierto para permitir llamadas desde cualquier origen local.

## Módulos Principales

### 1. Editor Visual (`app/templates/`, `lib/zpl.ts`, `lib/label-types.ts`)
- Canvas drag & drop con Konva
- Elementos: texto, QR, barcode (Code128/EAN13/EAN8/Code39/DataMatrix), imagen, serial, línea, rect, elipse
- Variables dinámicas `{{campo}}`
- Generación ZPL client-side con `lib/zpl.ts`
- Templates guardados en Supabase

### 2. Generadores Field-Based (`lib/generators/`)
Portados de `inteliar-printer-agent2/backend/`, basados en la arquitectura de [labelctl](https://github.com/mherrera53/labelctl):

| Archivo | Función |
|---------|---------|
| `label-presets.ts` | Configuraciones de tamaño de etiqueta (40x25mm, 76x51mm, 3x1 matrix, etc.) |
| `label-templates.ts` | Templates field-based builtin (basic-barcode, food-production, etc.) |
| `zpl-field-generator.ts` | Generación ZPL para templates field-based y element-based |
| `tspl-generator.ts` | Generación TSPL2 para impresoras TSC |
| `excel-parser.ts` | Parseo de Excel/CSV → rows de datos |

### 3. Parser Excel (`lib/generators/excel-parser.ts`, `app/upload/`)
- Lee XLSX y CSV con SheetJS
- Detecta headers automáticamente
- Calcula total de etiquetas por columna `cantidad`
- Usado tanto client-side como en API routes

### 4. Printer Agent (`printer-agent/`)
Proceso Node.js independiente que corre localmente en la máquina del cliente:

- `GET  /status` — estado + stats
- `POST /print` — recibe `{ type: "zpl"|"tspl", data: string }`, envía por TCP
- `GET  /log` — últimos 100 trabajos
- Modo `SIMULATE=true`: solo loguea, no conecta a impresora
- Detección automática de formato (ZPL = `^XA`, TSPL = `SIZE`)
- Timeout TCP configurable (10s)

### 5. Printer Agent Client (`lib/printer-agent-client.ts`)
Cliente browser-side que llama al agente local:

```ts
await checkPrinterAgent()                    // GET /status
await sendToPrinterAgent(zpl, 'zpl')         // POST /print
await getPrinterAgentLog()                   // GET /log
```
URL del agente persistida en `localStorage` (default `http://localhost:9638`).

## API Routes

### `POST /api/generate`
Genera comandos de impresión a partir de template + filas de datos.

```json
// Modo 1: template field-based (labelctl)
{ "templateId": "food-production", "rows": [...], "format": "zpl" }

// Modo 2: template element-based
{ "template": { "elements": [...], "width": 400, "height": 300 }, "rows": [...] }
```

Respuesta: `{ format, totalLabels, zpl | commands, preview }`

### `POST /api/print`
Genera + envía al printer-agent. Equivalente a `/api/generate` + llamada al agente.
Usar cuando Next.js corre localmente (acceso a localhost:9638).

### `GET /api/presets`
Lista todos los presets de tamaño de etiqueta (builtin + custom).

### `GET /api/label-templates`
Lista todos los templates field-based (builtin + custom).

## Flujo de Impresión

### Vía Editor Visual (Next.js en Vercel o local)
1. Usuario diseña etiqueta en editor Konva
2. Sube Excel → `lib/generators/excel-parser.ts` o SheetJS
3. Mapea columnas → variables `{{campo}}`
4. Click "Generar" → `lib/zpl.ts:generateZPL()` (client-side)
5. Click "Imprimir" → `lib/printer-agent-client.ts:sendToPrinterAgent()`
6. Printer agent recibe ZPL → envía por TCP → impresora imprime

### Vía Templates Field-Based (Next.js local)
1. `POST /api/generate` con `templateId` + `rows`
2. API route genera ZPL o TSPL2 con `lib/generators/`
3. `POST /api/print` envía al agente en localhost:9638
4. Printer agent envía por TCP → impresora imprime

## Base de Datos (Supabase)

```sql
-- Tablas principales
templates  (id, name, canvas_data, width_mm, height_mm, org_id, user_id)
jobs       (id, template_id, status, total_labels, org_id, created_at)
history    (id, job_id, status, message, timestamp)
```

## Configuración de Desarrollo

```bash
# Frontend
pnpm install && pnpm dev          # localhost:3000

# Printer Agent
cd printer-agent && npm install
cp .env.example .env
npm run dev                       # localhost:9638, nodemon

# Variables de entorno (.env.local en raíz)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

## Performance Goals

- Generación ZPL < 2s para 100 etiquetas
- Impresión < 60s para 100 etiquetas  
- Error de impresión < 1%

## Seguridad

- JWT con Supabase Auth (RLS en todas las tablas)
- Printer agent solo escucha en loopback (localhost)
- API routes validadas con Zod
- HTTPS en producción (Vercel)
