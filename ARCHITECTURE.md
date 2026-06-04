# Arquitectura Técnica - Inteliar Labels

## Objetivos

Diseñar, generar e imprimir etiquetas térmicas de forma masiva desde una aplicación SaaS.

## Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- - **Konva.js** - Canvas para editor visual
  - - **Tailwind CSS** - Estilos
    - - **Next.js 14** - Framework
     
      - ### Backend
      - - **Node.js** + Express
        - - **TypeScript**
          - - **Supabase** - Auth + DB
           
            - ### Librerías Clave
            - - **fluent-zpl** - Generación de etiquetas ZPL
              - - **SheetJS** - Parseado de Excel
                - - **axios** - HTTP client
                 
                  - ## Arquitectura
                 
                  - ```
                    Cliente Web (React + Konva)
                            ↑ HTTP
                    Backend API (Node.js)
                            ↑
                    Motor ZPL (fluent-zpl)
                            ↑
                    Printer Agent (labelctl fork)
                            ↑ TCP 9100
                    Impresora Térmica
                    ```

                    ## Módulos Principales

                    ### 1. Editor Visual
                    - Canvas drag & drop con Konva
                    - - Soporta: texto, imágenes, QR, códigos de barras
                      - - Variables dinámicas: `{{campo}}`
                        - - Guardado en JSON
                         
                          - ### 2. Procesador Excel
                          - - Lee XLSX y CSV
                            - - Detecta columnas automáticamente
                              - - Mapea columnas → variables
                               
                                - ### 3. Motor de Generación
                                - - Expande filas según columna "cantidad"
                                  - - Reemplaza variables `{{campo}}`
                                    - - Genera ZPL para cada etiqueta
                                      - - Batch final optimizado
                                       
                                        - ### 4. Printer Agent
                                        - - Fork de labelctl
                                          - - Escucha en localhost:9638
                                            - - Recibe ZPL por HTTP
                                              - - Envía a impresora por TCP 9100
                                                - - Retorna estado
                                                 
                                                  - ## Flujo de Impresión
                                                 
                                                  - 1. Usuario crea/selecciona plantilla
                                                    2. 2. Sube archivo Excel
                                                       3. 3. Sistema detecta columnas
                                                          4. 4. Usuario mapea columnas → variables
                                                             5. 5. Preview se genera
                                                                6. 6. Clic en "Imprimir"
                                                                   7. 7. Sistema procesa datos
                                                                      8. 8. Expande filas por cantidad
                                                                         9. 9. Genera ZPL
                                                                            10. 10. Envía al Agent
                                                                                11. 11. Agent imprime
                                                                                    12. 12. Retorna estado
                                                                                       
                                                                                        13. ## Base de Datos (Supabase)
                                                                                       
                                                                                        14. ```sql
                                                                                            tables:
                                                                                            - users (id, email, org_id)
                                                                                            - organizations (id, name, owner_id)
                                                                                            - templates (id, name, structure, org_id)
                                                                                            - jobs (id, template_id, status, output)
                                                                                            - history (id, job_id, status, timestamp)
                                                                                            ```

                                                                                            ## API Endpoints

                                                                                            ```
                                                                                            POST   /api/templates           - Crear plantilla
                                                                                            GET    /api/templates           - Listar plantillas
                                                                                            DELETE /api/templates/:id       - Eliminar plantilla

                                                                                            POST   /api/upload-excel       - Subir Excel
                                                                                            POST   /api/generate           - Generar ZPL
                                                                                            POST   /api/print              - Enviar a imprimir

                                                                                            GET    /api/jobs               - Estado de trabajos
                                                                                            GET    /api/history            - Historial
                                                                                            ```

                                                                                            ## Seguridad

                                                                                            - JWT con Supabase Auth
                                                                                            - - HTTPS en producción
                                                                                              - - Rate limiting
                                                                                                - - Validación de entrada
                                                                                                 
                                                                                                  - ## Performance
                                                                                                 
                                                                                                  - - Generación ZPL < 2seg para 100 etiquetas
                                                                                                    - - Impresión < 60seg para 100 etiquetas
                                                                                                      - - Error < 1%
                                                                                                       
                                                                                                        - ## Deploy
                                                                                                       
                                                                                                        - - Frontend: Vercel
                                                                                                          - - Backend: Vercel Functions / Node
                                                                                                            - - DB: Supabase Cloud
                                                                                                              - - Agent: Local en cliente
