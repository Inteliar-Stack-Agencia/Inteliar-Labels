# Investigación BarTender — notas para Inteliar Labels

Research en curso, disparado por un prospecto (mencionó a otro cliente con software de pedidos propio que exporta a una plantilla conectada a BarTender, con filtro por día). Instalando BarTender 12.0.1 trial para ver cómo funciona por dentro.

## Pantalla de instalación — "Opciones de instalación avanzadas"

BarTender ofrece 3 modos de instalación:

1. **BarTender** — todas las características excepto impresión web/móvil. Recomendado para usuarios nuevos.
2. **BarTender Print Portal** — agrega soporte de impresión web y móvil. Requiere **IIS** (Internet Information Services, servidor web de Windows).
3. **Configurar como servidor de licencia especializado** — solo el servicio de licencias + Administration Console.

Además, trae tildado por defecto: **"Añadir Microsoft SQL Server Express"** — usado por la "BarTender System Database". El texto dice explícitamente: *"Debe dejarlo habilitado a menos que configure una base de datos centralizada."*

### Dato importante para nuestra arquitectura

Esto confirma que BarTender **no es liviano** — instala una base de datos SQL Server completa por default. Nuestra arquitectura (agente Node liviano de ~pocos MB, sin base de datos local) es objetivamente más simple de instalar y mantener para una PyME chica. Vale la pena usar esto en la venta: *"no vas a necesitar instalar una base de datos SQL Server en la compu de la caja, como sí pide BarTender."*

Instala por default en `C:\Program Files\Seagull\BarTender 12.0`.

## Pendiente de confirmar una vez instalado

- Cómo funciona el filtro por día (¿carpeta con un archivo por día? ¿una tabla en la SQL Server Express con columna de día? ¿el desplegable de plantillas lee de esa base?).
- Cómo se conecta el software de pedidos del cliente (Expocater / el otro prospecto) a esa base — ¿escribe directo a la SQL Server Express de BarTender, o hay un paso intermedio (export a Excel/CSV que BarTender importa)?
- Si el "filtro por día" es una feature nativa de BarTender (Database Connectivity setup) o es algo que el cliente armó a medida.

## Hallazgos previos de esta investigación (sesión anterior)

- BarTender licencia por **impresora en uso simultáneo**, no por IP/computadora — ver `docs/google-ads-campaign.md` y el PDF comparativo armado para Expocater (Inteliar-vs-BarTender-Expocater.pdf) para el detalle completo de precios y diferencias.
- El instalador de BarTender **está firmado digitalmente** (no dispara SmartScreen) y tiene checkbox de aceptación de EULA — dos cosas que nuestro instalador (`printer-agent-desktop`) todavía no tiene. Ver sección "Pendiente" abajo.

## EULA de BarTender (Seagull Software) — hallazgos de la lectura completa

Leímos el EULA consolidado (abril 2026). Confirma y afina varias cosas:

- **Sección 2.6.4 "Printer-Based License"**: la licencia se mide por cantidad de impresoras usadas en una **"7-Day Period"** (ventana móvil de 7 días), no por uso simultáneo estricto. Esto explica MEJOR el caso de la clienta que en algún momento nos contó: si usa la impresora de la Oficina A el lunes y la de la Oficina B el miércoles de la misma semana, BarTender puede contar eso como "2 impresoras" dentro de esa ventana de 7 días, aunque nunca las haya usado a la vez. Reforzar este matiz en la conversación de venta.
- **Sección 3.2(j)**: prohíbe explícitamente "reasignar derechos de licencia entre impresoras con tanta frecuencia que permita compartir una sola licencia entre varias impresoras" — es una cláusula contractual diseñada a propósito para desalentar el patrón "cambio de configuración cada vez que cambio de local", que es justo lo que hacía la clienta.
- **Sección 2.6.5 / 2.6.6**: BarTender también puede licenciar por **cantidad de items impresos por semana** (5.000 por licencia de impresora) o por **cantidad de etiquetas impresas** en un período — hay más de una dimensión de facturación posible según el tipo de licencia, no es siempre "solo por impresora".
- **Sección 2.4**: BarTender recolecta telemetría de uso (impresoras disponibles, ubicación geográfica de la impresora, ISP, info de cada trabajo de impresión) para "license enforcement" — el control de licencias es literalmente telemetría constante, no solo un chequeo al abrir el programa.

### ⚠️ Advertencia legal para nosotros — no reverse-engineering

Secciones 3.2(a) y 3.2(k) del EULA prohíben expresamente a cualquier usuario licenciado: (a) hacer ingeniería inversa del software, y (k) "desarrollar un producto que convierta el formato de archivo BTW a un formato de impresión alternativo". **No deberíamos, bajo ningún concepto, usar el trial de BarTender para inspeccionar/decodificar el formato `.btw` ni construir un importador de plantillas BarTender → Inteliar Labels** a partir de lo que se vea en la instalación de prueba — sería un incumplimiento contractual de quien instaló el trial. Cualquier compatibilidad con BarTender que se quiera construir en el futuro debe basarse en documentación pública/formatos abiertos (ZPL, EPL, etc.), nunca en el archivo `.btw` propietario.

### Cambio aplicado a nuestros propios Términos y Condiciones

A partir de esta lectura, se agregaron dos secciones a `/terminos` (`app/terminos/page.tsx`) que no existían:
- **"Límites de uso según plan"** — deja explícito que los límites de dispositivos/impresoras/impresiones son parte del contrato (relevante ahora que el plan Mensual hace cumplir 1 impresora técnicamente), y prohíbe compartir cuentas para eludirlos.
- **"Ley aplicable y jurisdicción"** — faltaba por completo; ahora especifica Argentina / CABA.

No se copió texto de BarTender — son cláusulas propias, redactadas en base a qué huecos tenía nuestro documento comparado con el de ellos. **Nota: no es asesoramiento legal formal**, conviene que un abogado las revise antes de considerarlas definitivas.

## Recorrido por BarTender Designer (trial activado, edición Enterprise)

Activación: trial de 30 días, 3 impresoras (aunque en el formulario de calificación se había puesto "1 impresora" — el trial siempre da 3 fijo, no ajusta según la respuesta). Licencia compartida por red con un "Servidor" con nombre propio (confirma el modelo de licencia atada a un servidor local, coherente con el problema de la clienta al cambiar de IP/oficina).

### Asistente para nuevo documento (8 pantallas)

Punto de inicio → Selección de impresora → Selección de material → Elementos por página → Bordes laterales (pide en mm el margen sin usar a cada lado — nosotros resolvemos esto automático con un margen fijo de 2mm, sin pedirle nada al usuario) → Forma del elemento → Tamaño de la plantilla (con opción de orientación "Vertical 180°", mismo tipo de rotación que tuvimos que resolver nosotros) → Fondo de la plantilla → Completado.

**Conclusión de UX**: 8 pantallas de asistente solo para crear una plantilla en blanco, antes de tocar el diseño real. Nuestro flujo (subir Excel → elegir/crear plantilla con IA → imprimir) es sensiblemente más corto. Punto fuerte para la venta a comercios chicos sin experiencia en software de diseño.

### Menú completo del Designer

- **Archivo**: Configurar conexión a la base de datos, Reprint Console, Exportar plantilla de código de impresora, Opciones del documento, Contraseña del documento, Ver registro de revisión incrustado.
- **Ver**: Diseño de plantilla (F7) / **Formulario de entrada de datos (F8)** — confirma en vivo la función de carga manual que en la comparativa marcamos como exclusiva de ediciones pagas superiores (Starter no la tiene).
- **Administrar**: Configurar alertas, Configurar el documento de BarTender, **Configuración del escáner y la cámara**, **Configurar la balanza** — soporte nativo para hardware de báscula/scanner integrado a la impresión, algo que nosotros no tenemos y probablemente no necesitemos para el público actual, pero vale tenerlo en cuenta si en el futuro apuntamos a comercios con balanza (carnicerías, verdulerías, fiambrerías).
- **Herramientas**: Librarian, **Printer Maestro** (monitoreo de impresoras), Reprint Console, Administration Console, Process Builder, **Data Builder** (arma la base de datos propia de BarTender), Integration Builder, **History Explorer** (auditoría/trazabilidad de impresiones — nosotros no tenemos un equivalente; nuestro Historial es más básico, sin trazabilidad detallada por etiqueta individual), **Print Station** (probablemente la app simplificada "solo imprimir" para operarios de planta, sin acceso al diseñador completo — el punto de comparación más justo contra nuestra UI de impresión, no contra el Designer completo).
- **Origen de datos** (panel lateral): tipos disponibles — Datos incrustados, Hora, Fecha, Número de serie, Base de datos, Campos de datos de tabla, Campos de entrada de datos, Orígenes de datos con nombre, Bibliotecas, Campos de datos globales, Valores de objeto, Campos del trabajo de impresión, Archivo externo, **Comando Visual Basic** (scripting), Campos de plantilla de código de impresión.

### Asistente de conexión a base de datos — tipos soportados

Extremadamente amplio: Archivo de texto/CSV, XML, BarTender Data Builder, **Microsoft Excel**, Excel Online, Microsoft Access, Microsoft SQL Server, Oracle, JSON, Firebird, IBM DB2, IBM Informix, **Hojas de Google**, Microsoft Azure SQL, MySQL, MariaDB, PostgreSQL, **QuickBooks Online**, SAP IDoc, SAP HANA, conexión OLE DB genérica, conexión ODBC genérica, e importar configuración desde archivo.

**Lectura competitiva**: esta lista confirma que BarTender apunta a integración con sistemas empresariales pesados (SAP, Oracle, ERPs). Es un argumento de venta a favor nuestro con el público chico: paga esa complejidad (aunque nunca la use) con una curva de aprendizaje más alta, mientras que nosotros vamos directo a lo que ese público realmente usa (Excel/CSV).

**Nota metodológica**: no llegamos a conectar un Excel real ni a ver el mecanismo del filtro por día — quedó pendiente para la próxima sesión de prueba, con un Excel armado a propósito (columnas LUNES/MARTES/MIÉRCOLES/JUEVES/VIERNES + EMPRESA + NOMBRE Y APELLIDO, tal como se vio en la captura original del prospecto).

## Pendientes para Inteliar Labels (backlog, sin decidir fecha)

- [ ] Certificado de firma de código para el instalador (evita el bloqueo de SmartScreen/antivirus reportado por clientes). Costo ~US$100-400/año, requiere verificación de la empresa — decisión de negocio, no solo técnica.
- [ ] Checkbox de aceptación de Términos y Condiciones durante la instalación del agente.
- [ ] "Opciones avanzadas de instalación" (carpeta destino configurable, etc.) — baja prioridad, nice-to-have.
- [ ] Evaluar si conviene soportar import de Excel filtrado por columna de día de la semana (a confirmar si es lo que el prospecto realmente necesita, una vez se entienda cómo lo hace BarTender).
- [ ] Evaluar si conviene soportar ingesta automática de archivos (carpeta compartida o API) desde un software de pedidos externo, en vez de requerir upload manual a `/upload` — depende de qué tan atado esté el cliente a su software actual.
- [ ] Evaluar si vale la pena un "Historial" con más trazabilidad (por etiqueta individual, no solo por trabajo) — BarTender tiene "History Explorer" nativo, nosotros no.
- [ ] Si en el futuro apuntamos a carnicerías/verdulerías/fiambrerías: BarTender soporta integración nativa con balanzas — anotado para no reinventar la rueda si surge esa necesidad.
