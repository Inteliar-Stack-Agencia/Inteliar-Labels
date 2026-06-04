# Product Requirements Document

## Producto

Inteliar Labels

## Problema

Las soluciones actuales como BarTender son:
- Complejas
- - Costosas
  - - Sobredimensionadas
   
    - Las PyMEs necesitan una solución simple para:
    - - Diseñar etiquetas
      - - Cargar Excel
        - - Imprimir en lote
         
          - ## Objetivo
         
          - Permitir imprimir cientos de etiquetas en menos de 2 minutos sin conocimientos técnicos.
         
          - ## Usuario Ideal
         
          - ### Primario
          - - Empresas alimenticias
            - - Cocinas industriales
              - - Viandas
                - - Catering
                 
                  - ### Secundario
                  - - Logística
                    - - Retail
                      - - Laboratorios
                       
                        - ## Historias de Usuario
                       
                        - ### HU-001
                        - Como usuario
                        - Quiero crear una plantilla
                        Para reutilizarla múltiples veces.

### HU-002
Como usuario
Quiero subir un Excel
Para generar etiquetas automáticamente.

### HU-003
Como usuario
Quiero indicar una cantidad
Para imprimir múltiples copias.

### HU-004
Como usuario
Quiero ver una vista previa
Para validar antes de imprimir.

### HU-005
Como usuario
Quiero enviar las etiquetas a una impresora térmica
Para evitar procesos manuales.

## Requisitos Funcionales

- RF-001: Crear plantilla
- - RF-002: Editar plantilla
  - - RF-003: Duplicar plantilla
    - - RF-004: Eliminar plantilla
      - - RF-005: Subir Excel
        - - RF-006: Importar CSV
          - - RF-007: Mapear columnas
            - - RF-008: Generar etiquetas
              - - RF-009: Imprimir etiquetas
                - - RF-010: Guardar historial
                 
                  - ## Requisitos No Funcionales
                 
                  - - Respuesta menor a 2 segundos
                    - - Compatible con Chrome
                      - - Compatible con Edge
                        - - Diseño responsive
                          - - Arquitectura multi-tenant
                           
                            - ## KPI Iniciales
                           
                            - - Tiempo de generación < 5 segundos
                              - - Impresión de 100 etiquetas < 60 segundos
                                - - Error de impresión < 1%
                                 
                                  - ## Alcance MVP
                                 
                                  - ### Incluye:
                                  - - Editor
                                    - - Excel
                                      - - Variables
                                        - - Batch
                                          - - Impresión
                                           
                                            - ### No incluye:
                                            - - ERP
                                              - - Facturación
                                                - - IA
                                                  - - App móvil
                                                   
                                                    - ## Roadmap
                                                   
                                                    - MVP → Producción alimentaria → Trazabilidad → ERP ligero → Marketplace de plantillas
