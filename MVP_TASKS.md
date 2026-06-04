# MVP Backlog - Inteliar Labels

## Sprints (10 semanas)

### Sprint 1: Configuración Base
- [ ] Crear estructura Next.js
- [ ] - [ ] Configurar Tailwind CSS
- [ ] - [ ] Integrar Konva.js
- [ ] - [ ] Crear layout base

- [ ] ### Sprint 2: Editor Visual
- [ ] - [ ] Canvas drag & drop
- [ ] - [ ] Añadir texto
- [ ] - [ ] Añadir imágenes
- [ ] - [ ] Añadir QR codes
- [ ] - [ ] Guardar como JSON

- [ ] ### Sprint 3: Variables Dinámicas
- [ ] - [ ] Crear sistema variables `{{campo}}`
- [ ] - [ ] Parser de variables
- [ ] - [ ] Preview dinámico
- [ ] - [ ] Gestor de plantillas

- [ ] ### Sprint 4: Excel & Batch
- [ ] - [ ] Integrar SheetJS
- [ ] - [ ] Leer XLSX/CSV
- [ ] - [ ] Detectar columnas
- [ ] - [ ] Mapeo variables
- [ ] - [ ] Expansión por cantidad

- [ ] ### Sprint 5: Motor ZPL
- [ ] - [ ] Integrar fluent-zpl
- [ ] - [ ] Generar texto ZPL
- [ ] - [ ] Generar QR ZPL
- [ ] - [ ] Generar códigos barras
- [ ] - [ ] Batch final

- [ ] ### Sprint 6: Impresión
- [ ] - [ ] Fork labelctl
- [ ] - [ ] Configurar printer agent
- [ ] - [ ] Endpoint POST /print
- [ ] - [ ] Conexión TCP 9100
- [ ] - [ ] Recibir estado

- [ ] ### Sprint 7: Backend Node.js
- [ ] - [ ] Configurar Express
- [ ] - [ ] JWT authentication
- [ ] - [ ] API Templates
- [ ] - [ ] API Jobs
- [ ] - [ ] API History

- [ ] ### Sprint 8: Supabase
- [ ] - [ ] Users table
- [ ] - [ ] Organizations
- [ ] - [ ] Templates storage
- [ ] - [ ] Jobs tracking
- [ ] - [ ] RLS policies

- [ ] ### Sprint 9: Testing
- [ ] - [ ] Tests generación ZPL
- [ ] - [ ] Tests impresión
- [ ] - [ ] Tests Excel parsing
- [ ] - [ ] Load testing

- [ ] ### Sprint 10: Deploy
- [ ] - [ ] GitHub Actions CI/CD
- [ ] - [ ] Deploy Vercel Frontend
- [ ] - [ ] Deploy Backend
- [ ] - [ ] Documentación
- [ ] - [ ] Launch MVP

- [ ] ## Criterio de Éxito MVP

- [ ] - [ ] Usuario puede crear plantilla
- [ ] - [ ] Usuario puede subir Excel
- [ ] - [ ] Sistema genera 100 etiquetas
- [ ] - [ ] Imprime en Honeywell PC42
- [ ] - [ ] Todo < 2 minutos

- [ ] ## KPIs

- [ ] - Generación: < 5 segundos para 100
- [ ] - Impresión: < 60 segundos para 100
- [ ] - Error rate: < 1%
- [ ] - Uptime: > 99%

- [ ] ## Roadmap Post-MVP

- [ ] 1. Producción Alimentaria
- [ ]    - Tracking de vencimientos
- [ ]       - Cálculos automáticos

- [ ]   2. Trazabilidad
- [ ]      - QR dinámicos
- [ ]     - Historial completo

- [ ] 3. ERP Ligero
- [ ]    - Stock básico
- [ ]       - Pedidos

- [ ]   4. Marketplace
- [ ]      - Plantillas compartidas
- [ ]     - Monetización
