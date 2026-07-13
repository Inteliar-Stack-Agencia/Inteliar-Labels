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

-- Integraciones (ver sección "Integraciones externas" más abajo)
mercadolibre_connections  (user_id pk, ml_user_id, access_token, refresh_token, expires_at)
tiendanube_connections    (user_id pk, store_id, access_token, scope)
ml_order_checklist        (id, user_id, source, order_id, preparado, despachado, archivado)
```

**Nota:** las migraciones en `supabase/migrations/` no se aplican solas — no hay paso de CI/deploy que corra `supabase db push`. Después de cada migración nueva hay que correr el SQL manualmente en el SQL Editor del proyecto de Supabase en producción.

## Integraciones externas (Mercado Libre, Tiendanube)

Ambas integraciones viven en `/integraciones` (`app/integraciones/page.tsx`), separadas de la carga de Excel manual (`/upload`). Comparten el mismo patrón: **OAuth2 authorization-code flow**, un botón "Conectar cuenta", y al aprobar quedan asociadas al usuario logueado de Inteliar Labels (no a una tienda/cuenta suelta).

### Patrón común de conexión

Para cada integración:
- `lib/<integracion>.ts`: `getAuthorizationUrl()`, `exchangeCodeForToken()`, `saveConnection()`, `isConnected()`, `disconnect()`, y un `fetchOrderRows(userId, mode)` que devuelve `{ columns, rows }` listos para el flujo de impresión.
- Rutas API en `app/api/integrations/<integracion>/`: `authorize` (GET, redirige a la pantalla de consentimiento), `callback` (GET, intercambia el `code` por token y guarda la conexión), `status` (GET), `disconnect` (POST), `orders` (POST, `{ mode }` → filas).
- Tabla en Supabase `<integracion>_connections` (una fila por `user_id`, service-role only, sin acceso público vía RLS — se lee/escribe solo desde `lib/<integracion>.ts` con `supabaseAdmin`).
- El resultado de "traer pedidos" se pasa a `/upload` vía **sessionStorage handoff** (`lib/import-handoff.ts`, `IMPORT_HANDOFF_KEY`) — evita duplicar la lógica de selección de plantilla/editor en una segunda pantalla. `goToUpload()` en `integraciones/page.tsx` escribe el handoff y navega a `/upload?imported=1`; `upload/page.tsx` lo lee en su `useEffect` de montaje y salta directo al paso 2.
- Si ninguna plantilla propia matchea las columnas importadas, `/upload` sugiere el preset más cercano de `lib/preset-templates.ts` (`matchingPresetId`), y el flujo de "crear esa plantilla" hace un round-trip a `/templates/new?preset=<id>&returnTo=upload` sin perder los datos importados (mismo mecanismo de sessionStorage).

### Mercado Libre (`lib/mercadolibre.ts`)

- **Credenciales**: `MERCADOLIBRE_CLIENT_ID`, `MERCADOLIBRE_CLIENT_SECRET` (env vars). App creada en [developers.mercadolibre.com.ar](https://developers.mercadolibre.com.ar), tipo no certificada (no bloquea el OAuth, solo restringe algunos badges de partner).
- **Authorization URL**: `https://auth.<dominio del sitio>/authorization`, donde el dominio depende del país — configurable con la env var `MERCADOLIBRE_SITE` (ej. `MLA` Argentina, `MLM` México, `MCO` Colombia, `MLB` Brasil, etc., default `MLA`), mapeado en `ML_SITE_DOMAINS` dentro de `lib/mercadolibre.ts`. El link a "Preferencias de venta" en `/integraciones` también usa este dominio dinámicamente (vía `storefrontDomain` que devuelve `/api/integrations/mercadolibre/status`). **Importante**: la app de Mercado Libre está hoy registrada solo para Argentina — la certificación de partner de ML no es necesaria para que el OAuth funcione (confirmado con soporte de ML), pero antes de cambiar `MERCADOLIBRE_SITE` en un deploy real conviene validar el flujo completo en ese país.
- **Token exchange/refresh**: `https://api.mercadolibre.com/oauth/token`. Los tokens expiran (`expires_in`) y tienen `refresh_token` — `getValidAccessToken()` refresca automáticamente 5 min antes de vencer.
- **Modos de import** (`ImportMode`): `"shipping"` (destinatario/dirección/localidad/provincia/cp/telefono/nro_orden, desde `/shipments/{id}`) y `"product"` (nombre/sku/cantidad/precio/nro_orden, desde `order_items`).
- **Etiqueta oficial de envío**: `fetchShippingLabelsZpl()` llama a `/shipment_labels?shipment_ids=...&response_type=zpl2` y devuelve el ZPL crudo que genera Mercado Envíos (con el código de seguimiento real que escanea el correo) — se manda directo al printer-agent, sin pasar por nuestro editor de plantillas. El tamaño de esa etiqueta (10×15cm sin troquel vs 10×19cm con troquel) lo define la cuenta del vendedor en "Preferencias de venta" de ML, no es parametrizable por API — documentado como nota de ayuda en la tarjeta de `/integraciones`.
- **Webhook** `app/api/webhooks/mercadolibre/route.ts`: requerido por ML para poder guardar la config de la app (debe responder 200 rápido); hoy solo loguea, no procesa notificaciones push.
- **Tabla**: `mercadolibre_connections` (migración `20260710_mercadolibre_connections.sql`).

### Tiendanube (`lib/tiendanube.ts`)

- **Credenciales**: `TIENDANUBE_CLIENT_ID`, `TIENDANUBE_CLIENT_SECRET`. App creada en [partners.tiendanube.com](https://partners.tiendanube.com), distribución **"Para tus clientes"** (privada — no requiere revisión pública de Tiendanube, se conecta manualmente).
- **Instalación**: a diferencia de ML, el flujo lo puede iniciar Tiendanube (link de instalación `/admin/apps/<app_id>/authorize` que se comparte con clientes) o nuestra propia app (`/api/integrations/tiendanube/authorize`, que redirige a `https://www.tiendanube.com/apps/<client_id>/authorize`). El callback (`/api/integrations/tiendanube/callback`) no recibe un `state` de vuelta — la asociación al usuario depende de que la sesión del navegador siga logueada en Inteliar Labels durante todo el flujo.
- **Token**: `POST https://www.tiendanube.com/apps/authorize/token`. A diferencia de ML, el `access_token` de Tiendanube **no expira** — no hay refresh flow.
- **API**: `https://api.tiendanube.com/v1/<store_id>/...`, header `Authentication: bearer <token>` (no es "Authorization", es "Authentication") + `User-Agent` obligatorio.
- **Gotcha de la API**: cuando un listado filtrado (ej. `/orders?payment_status=paid`) no tiene resultados, Tiendanube devuelve **404 con `"description": "Last page is 0"`** en vez de un array vacío — `tnFetch()` lo detecta y lo trata como `[]`, no como error.
- **Modos**: `fetchOrderRows(userId, "shipping" | "product")` (igual que ML, desde `/orders`) + `fetchCatalogRows(userId)` (catálogo completo publicado vía `/products`, no solo lo vendido — para etiquetas de góndola/precio).
- **Sin etiqueta oficial por API — confirmado, no es solo "pendiente de integrar"**: Tiendanube tiene su propio sistema de envío con tracking ("Envío Nube"), pago por etiqueta (se compra saldo, ej. $6.824 en una prueba real). A diferencia de ML, **no existe endpoint público (v1) para descargar el PDF de la etiqueta ni para generarla programáticamente** — confirmado directamente por el soporte/IA de Tiendanube. Los campos `shipping_tracking_number`, `shipping_tracking_url` y `fulfillments[].tracking_info.{code,url}` (poblados recién después de pagar la etiqueta) solo dan el número de seguimiento y un link a la página de tracking para el comprador, no al PDF. La etiqueta real trae códigos de clasificación del correo (QR, "FAP", códigos de ruta) que no se pueden replicar de forma confiable con una plantilla propia — por eso NO se intenta clonar la etiqueta oficial; para pedidos con Envío Nube hay que seguir generándola manualmente desde el panel de Tiendanube. Nuestra plantilla de control interno (`tiendanube-shipping` preset) sirve para envío personalizado o como chequeo interno, no como reemplazo.
- **Webhooks LGPD obligatorios** (`app/api/webhooks/tiendanube/`): `store-redact`, `customers-redact`, `customers-data-request` — Tiendanube exige tenerlos configurados para poder guardar la app, aunque hoy no persistimos datos de compradores (solo acknowledgean con 200).
- **Import por URL pública (deprecado)**: existió una primera versión que scrapeaba el catálogo de cualquier tienda pública por URL, sin login (`/api/tiendanube/products`). Se sacó una vez que la conexión OAuth quedó funcionando, porque cubre el mismo caso (tu propio catálogo) de forma más confiable y además trae pedidos.
- **Tabla**: `tiendanube_connections` (migración `20260711_tiendanube_connections.sql`).

### Checklist de "datos de comprador" (control interno)

Pantalla de solo lectura en `/integraciones` ("Ver datos de comprador") — deliberadamente **no imprime nada**: la idea original era ofrecer una etiqueta de control interno con los datos del comprador, pero como su tamaño típico (~8x5cm) no coincide con el de la etiqueta oficial de envío (10x15/19cm en ML), habría que cambiar el rollo de la impresora constantemente. Se resolvió mostrando los datos en pantalla en vez de imprimir.

Tiene un checklist manual persistido en Supabase (`ml_order_checklist`, migraciones `20260711_ml_order_checklist.sql` + `20260711b_order_checklist_source.sql`): columnas `preparado`/`despachado` (checkbox) y acciones de archivar/eliminar por fila. La tabla es compartida entre ML y Tiendanube — se distingue con la columna `source` (`"ml" | "tn"`), porque los números de orden no son únicos entre marketplaces.

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
