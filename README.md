# Inteliar Labels

Plataforma SaaS para diseño, generación e impresión masiva de etiquetas térmicas.

Alternativa moderna a BarTender para empresas de alimentos, logística, depósitos, laboratorios y retail con impresoras térmicas (Honeywell PC42, Zebra, TSC, Brother).

## Funcionalidades

- Editor visual de etiquetas con Konva (texto, QR, barcodes, líneas, serial)
- Upload de Excel / CSV con mapeo automático de variables `{{campo}}`
- Generación ZPL y TSPL2 en batch
- Templates field-based estilo labelctl (presets de tamaño incluidos)
- Impresión directa vía Printer Agent local (localhost:9638)
- Historial de trabajos e impresión
- Auth multitenant con Supabase
- Generación de templates con IA (Anthropic SDK)
- Integraciones con Mercado Libre y Tiendanube (OAuth): traer pedidos/productos e imprimir la etiqueta oficial de envío de Mercado Envíos — ver [ARCHITECTURE.md § Integraciones externas](./ARCHITECTURE.md#integraciones-externas-mercado-libre-tiendanube)

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 + TypeScript + TailwindCSS + shadcn/ui |
| Editor visual | Konva.js |
| Generación ZPL/TSPL2 | `lib/zpl.ts` (visual editor), `lib/generators/` (field-based) |
| Excel | SheetJS (xlsx) |
| Auth + DB | Supabase |
| Printer Agent | Node.js local — `printer-agent/` (puerto 9638) |

## Setup rápido

```bash
# 1. Configurar variables de entorno
cp .env.example .env.local     # completar con las claves reales (Supabase, MP, etc.)

# 2. Instalar dependencias del frontend Next.js
pnpm install
pnpm dev
# → http://localhost:3000

# 3. En otra terminal: iniciar el printer-agent local
cd printer-agent
npm install
cp .env.example .env       # configurar PRINTER_IP, SIMULATE, etc.
npm start
# → http://localhost:9638
```

Ver `.env.example` en la raíz para la lista completa de variables (Supabase,
Mercado Libre, Tiendanube, MercadoPago, Resend, Anthropic, cron). Sin las de
Supabase el build falla; el resto son necesarias solo para probar esa
integración puntual.

## Deploy

- `main` deploya automáticamente a producción (etiquetar.app) vía Vercel.
- Antes de mergear un cambio grande o riesgoso (pagos, licencias, auth), abrí
  un PR — Vercel genera un preview deploy con esa URL para probar sin tocar
  producción. Con pocos usuarios el merge directo a `main` es aceptable para
  cambios chicos; para cambios en `/api/webhooks/*`, `/api/license/*` o
  `/api/checkout/*`, usá el preview primero.

## Printer Agent

El `printer-agent/` es el bridge local entre el SaaS y la impresora física:

- Escucha en `http://localhost:9638`
- Recibe comandos ZPL o TSPL2 via `POST /print`
- Envía por TCP al puerto 9100 de la impresora en red
- En modo `SIMULATE=true` solo loguea (default en dev)

```bash
# Variables de entorno en printer-agent/.env
AGENT_PORT=9638
PRINTER_IP=192.168.1.100   # IP de la impresora en tu red
PRINTER_PORT=9100
SIMULATE=false             # false para imprimir de verdad
```

**Desde el frontend** se llama con `lib/printer-agent-client.ts`:
```ts
import { sendToPrinterAgent, checkPrinterAgent } from '@/lib/printer-agent-client'

const status = await checkPrinterAgent()  // verifica que el agent está corriendo
const result = await sendToPrinterAgent(zplString, 'zpl')
```

## API Routes

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/generate` | Genera ZPL/TSPL2 desde template+rows |
| `POST /api/print` | Genera + envía al printer-agent (Next.js local) |
| `GET  /api/print` | Historial de impresión (in-memory) |
| `GET  /api/presets` | Lista presets de tamaño de etiqueta |
| `POST /api/presets` | Crea preset personalizado |
| `GET  /api/label-templates` | Lista templates field-based (builtin + custom) |
| `POST /api/label-templates` | Crea template field-based personalizado |

## Estructura

```
/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── generate/         # Generación ZPL/TSPL2
│   │   ├── print/            # Proxy al printer-agent
│   │   ├── presets/          # Presets de etiqueta
│   │   └── label-templates/  # Templates field-based
│   ├── dashboard/
│   ├── templates/
│   ├── upload/
│   ├── imprimir/
│   ├── jobs/
│   ├── history/
│   └── settings/
├── components/               # UI components (shadcn/ui)
├── lib/
│   ├── zpl.ts                # ZPL generator para editor visual Konva
│   ├── label-types.ts        # Tipos del editor visual
│   ├── printer-agent-client.ts  # Cliente browser → printer-agent
│   ├── generators/
│   │   ├── label-presets.ts  # Presets de tamaño (labelctl-style)
│   │   ├── label-templates.ts   # Templates field-based
│   │   ├── zpl-field-generator.ts  # ZPL field-based + element-based
│   │   ├── tspl-generator.ts    # TSPL2 para impresoras TSC
│   │   └── excel-parser.ts      # Parser Excel/CSV (server-side)
│   └── supabase/
├── printer-agent/            # Agente local Node.js (se corre por separado)
│   ├── src/index.js
│   ├── package.json
│   └── .env.example
└── supabase/                 # Migraciones SQL
```

## Documentación

- [PRD.md](./PRD.md) — Product Requirements Document
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura técnica
- [MVP_TASKS.md](./MVP_TASKS.md) — Backlog de sprints
- [docs/RELAY.md](./docs/RELAY.md) — Relay de impresión en la nube (Multipunto entre redes distintas) — construido, no activado
- [docs/PRICING.md](./docs/PRICING.md) — Estructura de planes
- [docs/MERCADOLIBRE.md](./docs/MERCADOLIBRE.md) — Integración Mercado Libre
