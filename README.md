# Inteliar Labels

Plataforma SaaS para diseño, generación e impresión masiva de etiquetas térmicas.

Alternativa moderna, simple y económica a BarTender para empresas de alimentos, logística, depósitos, laboratorios, retail y cualquier negocio que utilice impresoras térmicas (Honeywell PC42, Zebra, Brother, etc.).

## Funcionalidades MVP

- Crear plantillas visuales de etiquetas
- Subir archivos Excel / CSV con datos
- Mapeo automático de variables dinámicas
- Generación de etiquetas en lote
- Impresión directa a impresoras térmicas

## Stack

- **Frontend:** Next.js 16 + TypeScript + TailwindCSS + shadcn/ui
- **Editor visual:** Konva.js
- **Excel:** SheetJS
- **ZPL:** fluent-zpl
- **Backend:** Supabase (auth + DB)
- **Printer Agent:** Node.js (local)

## Desarrollo

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estructura

- `/` — Landing page pública
- `/dashboard` — Dashboard del SaaS
- `/templates`, `/upload`, `/jobs`, `/history`, `/preview`, `/settings`

## Documentación

- [PRD.md](./PRD.md) — Product Requirements Document
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura técnica
- [MVP_TASKS.md](./MVP_TASKS.md) — Backlog de sprints
