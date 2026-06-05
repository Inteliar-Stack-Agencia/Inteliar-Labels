# Inteliar Labels — CLAUDE.md

## Qué es esto

SaaS para diseñar e imprimir etiquetas térmicas en masa para el mercado argentino (viandas, almacenes, logística, alimentos). El usuario crea plantillas con variables dinámicas (`{{campo}}`), sube un Excel, y el sistema genera ZPL para impresoras Zebra/compatibles.

## Stack real

- **Next.js 16.2** App Router, TypeScript, `"use client"` en páginas de editor
- **Supabase** — auth (email/password), base de datos (tabla `templates`), storage (bucket `logos`)
- **Tailwind CSS** + shadcn/ui components
- **ZPL generado en `lib/zpl.ts`** — sin librerías externas, se construye el string manualmente
- **Deploy**: Vercel (frontend + API routes como serverless functions)

## Estructura de carpetas

```
app/
  auth/login/          — Login con Supabase
  dashboard/           — Dashboard (actualmente placeholder)
  templates/
    page.tsx           — Lista de plantillas del usuario
    new/page.tsx       — Crear plantilla (preset picker → editor)
    [id]/edit/page.tsx — Editar plantilla existente
  print/page.tsx       — Subir Excel + generar ZPL + imprimir
  manual/page.tsx      — Manual de uso
  api/
    ai/generate-template/ — Genera elementos de plantilla con Claude AI
lib/
  label-types.ts       — Tipos: ElementType, LabelElement, BarcodeType
  zpl.ts               — Genera ZPL a partir de LabelElement[]
  date-vars.ts         — Variables de fecha dinámica ({{HOY}}, etc.)
  preset-templates.ts  — 6 plantillas predefinidas para el picker
  supabase/client.ts   — Cliente Supabase browser
components/
  dashboard/           — DashboardLayout, sidebar
  ui/                  — shadcn/ui (Button, etc.)
```

## Tipos clave (`lib/label-types.ts`)

```typescript
type ElementType = "text" | "qr" | "barcode" | "image" | "serial" | "line" | "rect"

interface LabelElement {
  id: string
  type: ElementType
  content: string         // texto o {{variable}}
  x: number              // posición en canvas units (ZPL trata como mm aprox)
  y: number
  fontSize: number
  bold: boolean
  imageUrl?: string
  imgWidth?: number      // mm
  imgHeight?: number     // mm
  barcodeType?: BarcodeType
  lineWidth?: number     // mm (para line y rect)
  lineHeight?: number    // mm (solo rect)
  lineThickness?: number // mm
  // serial
  serialStart?: number
  serialIncrement?: number
  serialDigits?: number
  serialPrefix?: string
  serialSuffix?: string
}
```

## Canvas y escala

```typescript
const SCALE = 3
// px en pantalla = valor_mm * SCALE / 10
// Conversión mouse → canvas units: dx = (ev.clientX - startX) * 10 / SCALE
```

El canvas es un `div` de `widthMm * SCALE` × `heightMm * SCALE` px.

## ZPL (`lib/zpl.ts`)

- Impresoras 203 dpi → 8 dots/mm
- Texto: `^A0N` con tamaño calculado
- QR: `^BQN`
- Barcode: `^BCN` (code128), `^BEN` (ean13/8), etc.
- Línea: `^GB{w},{thickness},{thickness}^FS`
- Rect: `^GB{w},{h},{thickness}^FS`
- Imagen: convertida a bitmap ZPL vía `^GFA`

## Editor (new/page.tsx y [id]/edit/page.tsx)

Ambos archivos son casi idénticos. El de `new` tiene un paso previo de "preset picker" que muestra `PRESET_TEMPLATES`.

**Drag para mover:** `handleElementMouseDown` — usa `dragRef` para tracking.

**Drag para resize:** `handleResizeMouseDown` — maneja line (solo ancho), rect (ancho+alto), image (ancho+alto con `lockAspect`). Los handles son cuadraditos 8×8px en el borde del elemento seleccionado.

**Panel de propiedades:** lado derecho, muestra campos según el tipo de elemento seleccionado.

## Git / push

El push local falla con HTTP 503. Siempre usar `mcp__github__create_or_update_file` para pushear. Antes de pushear, obtener el SHA actual del archivo en GitHub con `mcp__github__get_file_contents`.

Branch de desarrollo activo: `claude/gracious-bell-lE4Gr`
Branch productivo: `main`

## Estado actual — qué está hecho

- [x] Auth con Supabase (login/logout)
- [x] CRUD de plantillas (crear, listar, editar, eliminar)
- [x] Editor visual: texto, QR, código de barras, numeración serial, línea, rectángulo, imagen/logo
- [x] Drag para mover elementos en el canvas
- [x] Drag para resize (línea, rect, imagen)
- [x] Imágenes sin límite de tamaño (puede superar el 100% del label)
- [x] Aspect lock para imágenes
- [x] Variables dinámicas `{{campo}}` y fechas dinámicas (`{{HOY}}`, etc.)
- [x] Generación ZPL completa
- [x] Subida de logos a Supabase Storage
- [x] Generación de plantilla con IA (Claude via API route)
- [x] Preset picker con 6 plantillas predefinidas
- [x] Pantalla de impresión: sube Excel, genera ZPL por fila, descarga o imprime
- [x] Manual de uso
- [x] Tamaños de etiqueta predefinidos (80×40, 100×50, 100×150, 50×30, 100×100)

## Pendiente (backlog)

- [ ] **Auth guard** — redirigir a `/auth/login` si no hay sesión en páginas protegidas
- [ ] **Vista previa de etiqueta** — renderizar cómo quedaría impresa antes de generar ZPL
- [ ] **Validación de variables** — avisar si el Excel no tiene las columnas que usa la plantilla
- [ ] **Dashboard real** — historial de trabajos, estadísticas, últimas impresiones
- [ ] **Configuración de impresora** — IP, puerto, DPI por perfil de usuario
- [ ] **Período de prueba / control de acceso** — trial, planes, límites por usuario
- [ ] **Onboarding** — flujo guiado para usuarios nuevos

## Comandos útiles

```bash
npm run dev      # desarrollo local
npm run build    # build de producción
npm run lint     # ESLint
```
