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

## ✅ RESUELTO: cómo funciona el "filtro por día"

Conectamos un Excel real (uno de los nuestros, "Viandas Diarias 70x30", columnas `plato`/`cantidad`) a través de "Configurar conexión a la base de datos" → panel "Configuración de la base de datos", que tiene en el menú izquierdo: Instrucción SQL, Tablas, Campos, Criterio de ordenación, **Filtro**, Opciones, Registros por elemento, Navegador de registros.

**"Filtro" es un constructor de condiciones genérico** ("Haga clic en el botón '+' para añadir una Condición de filtro"), tipo WHERE de SQL, mostrando como columnas disponibles las que tenga el Excel conectado (en nuestra prueba: `plato`, `cantidad`). **No es una función específica de "día de la semana"** — es un filtro de filas por cualquier columna y valor.

Conclusión: lo que el prospecto/cliente describió ("filtra por día") es simplemente este filtro genérico aplicado sobre un Excel que tiene una columna de día (o una columna por día, según la captura original con LUNES/MARTES/etc. como nombres de campo) — no hay ninguna feature "day-of-week aware" nativa en BarTender. Es exactamente lo que nosotros podríamos construir: un filtro de filas por columna+valor en nuestro propio flujo de `/upload`, sin necesitar nada BarTender-específico.

**Idea concreta y acotada para Inteliar Labels**: agregar un filtro simple en el paso 2 de `/upload` — "mostrar solo filas donde [columna] = [valor]" — antes de la vista previa/confirmación. Con esto el cliente podría subir un Excel con columna "día" (o una por cada día) y quedarse solo con las filas de hoy antes de imprimir. Bajo costo de desarrollo, resuelve exactamente el caso de uso sin copiar nada de BarTender (es una función de filtrado de datos genérica y obvia, no algo propietario de ellos).

### ⚠️⚠️ Segunda corrección (la definitiva) — Andrea lo explicó directo

Las dos hipótesis anteriores (filtro genérico de BarTender, y carpeta con archivo generado por su sistema por día) **estaban mal**. Andrea lo aclaró directamente, y coincide con la primerísima pista que ya teníamos desde el inicio de esta investigación (la captura original con "Nombre de campo: EMPRESA, JUEVES, LUNES, MARTES, MIÉRCOLES, NOMBRE Y APELLIDO, VIERNES"):

- **Ella trabaja sobre una semana entera, no un archivo por día.** Un solo Excel con toda la semana.
- **La estructura real: una columna por cada día** (LUNES, MARTES, MIÉRCOLES, JUEVES, VIERNES), cada una con la comida de ese día — además de columnas fijas como empresa y empleado/comensal. Como ella dijo: *"la comida está en función del día — si no tenés el día no tenés la comida"*.
- **El campo "comida" de la etiqueta está vinculado a UNA columna de día específica**, elegida en el diseño de la plantilla (el desplegable "Nombre de campo" que vimos en la primerísima captura). Para imprimir el martes, alguien selecciona la columna MARTES en ese campo antes de imprimir.

**No hay ningún mecanismo automático que detecte el día — es una elección manual de qué columna usar**, hecha en el diseño de la etiqueta (BarTender) cada vez que cambia el día.

### ✅ Esto ya lo podemos replicar HOY, sin desarrollar nada nuevo

La solución con Inteliar Labels es más simple todavía, porque nuestro sistema ya ignora columnas no usadas por la plantilla (ver arriba):

1. Andrea arma **una plantilla por día** en Inteliar Labels (una sola vez): "Etiqueta Lunes" con `{{lunes}}`, "Etiqueta Martes" con `{{martes}}`, etc. — 5 plantillas, cada una apuntando a su columna correspondiente del mismo Excel semanal.
2. Todos los días sube el **mismo Excel semanal completo** (con las 5 columnas de días) a `/upload`.
3. Elige la plantilla del día que corresponda (Lunes, Martes, etc.) de la lista — el sistema automáticamente toma solo esa columna e ignora el resto, exactamente como ya vimos que funciona.

Esto ya está cubierto por lo que armamos hoy (sugerencia de plantilla por columnas + ignorar columnas no usadas) — no hace falta construir un filtro de fila por día ni ninguna función nueva. Solo hace falta que Andrea arme esas 5 plantillas una vez.

**Pregunta concreta a hacerle a Andrea**: *"¿Tu sistema de pedidos puede exportar un Excel con esa misma estructura (una columna por día de la semana), aparte de lo que ya usa para BarTender?"* Si ya usa esa estructura para BarTender, lo más probable es que también pueda exportarla a un Excel plano.

### ✅ Ya cubierto: "destildar un item antes de imprimir"

El cliente también mencionó que antes de imprimir podía destildar filas que no quería imprimir. **Ya lo tenemos** — en `/upload`, paso de confirmación, la sección "Vista previa de datos" tiene un checkbox por fila ("Destildá las filas que no querés imprimir esta vez") más botones "Todas"/"Ninguna". No requiere ningún desarrollo nuevo, es un punto a favor para la comparativa (no hace falta un diálogo aparte como en BarTender).

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

### Serialización (numeración incremental)

Diálogo completo: valor inicial, incremento/decremento, método (numérico o alfabético A-Z), preservar cantidad de caracteres, cuándo incrementar (por evento, con intervalo configurable), y "Cantidad de impresión" separada en "Números de serie" (cuántos valores distintos) x "Copias por número de serie" (cuántas copias idénticas de cada uno). Nuestro elemento `serial` (`lib/label-types.ts`) ya cubre prefix/suffix/start/increment/digits — el matiz que nos falta es la separación entre "números de serie distintos" y "copias por cada uno" como dos controles independientes en la pantalla de impresión (hoy lo resolvemos con la columna `cantidad` del Excel, que es distinto pero cumple un rol similar).

### Códigos de barras — catálogo completo

BarTender tiene **119+ simbologías** organizadas por categoría (Atención médica, Digimarc, Farmacéutico, GS1 por aplicación/por simbología, Postal/Envíos, TLC — automotriz, Todas). Nosotros soportamos 6: Code128, EAN-13, EAN-8, Code39, DataMatrix, QR.

La diferencia es enorme en cantidad, pero la mayoría de esas 119 son de nicho (farmacéutico, atención médica, automotriz — GS1 AI específicos). Las 6 que tenemos cubren el uso real de nuestro público actual (retail, catering, e-commerce). Si en el futuro crecemos hacia logística/mayoristas, las que más probablemente pidan y no tenemos: **ITF-14** (cajas/cartones de logística), **GS1-128** (estándar de cadena de suministro/retail), **PDF417** (usado en carnets/documentos, algunos couriers). No vale la pena construir el catálogo completo — son casos de nicho que no aplican a este mercado.

### Tercera confirmación de Andrea — celdas vacías + cómo carga el archivo en BarTender

Andrea confirmó por escrito los diagramas corregidos y agregó dos precisiones:

1. **Las celdas vacías, no las filas, indican quién no pidió ese día.** Un empleado que pidió el lunes pero no el miércoles sigue apareciendo en la lista igual — el casillero de "miércoles" queda vacío para esa fila. Ella tilda/destilda en base a eso. Esto **no cambia el diagrama enviado**: el paso "destildás lo que no querés imprimir" ya cubre este caso tal cual, porque en Inteliar Labels esas filas con la columna del día vacía muestran el dato en blanco y se destildan igual que hoy — no hace falta desarrollar nada nuevo para esto tampoco.
2. **Cómo carga el archivo en BarTender**: primero arma la etiqueta (el diseño), y recién después usa el ícono chico de conexión a datos (el Asistente de conexión a base de datos ya documentado arriba, con Excel entre los tipos soportados) para indicarle desde dónde levantar el archivo. Su sistema le genera el Excel con extensión `.xlsx` — tuvo un problema anterior porque el archivo no tenía esa extensión y tuvo que corregirlo.

Se ofreció a grabar un video mostrando cómo arma la etiqueta en BarTender paso a paso — pendiente, sería la confirmación definitiva del único punto que seguía marcado "¿ASÍ ES?" en el diagrama (el cambio manual de a qué columna de día apunta el campo "comida").

## Pendientes para Inteliar Labels (backlog, sin decidir fecha)

- [ ] Certificado de firma de código para el instalador (evita el bloqueo de SmartScreen/antivirus reportado por clientes). Costo ~US$100-400/año, requiere verificación de la empresa — decisión de negocio, no solo técnica.
- [ ] Checkbox de aceptación de Términos y Condiciones durante la instalación del agente.
- [ ] "Opciones avanzadas de instalación" (carpeta destino configurable, etc.) — baja prioridad, nice-to-have.
- [ ] **Construir filtro de filas por columna+valor en `/upload` paso 2** — ya confirmado que resuelve el caso "filtrar por día" sin nada BarTender-específico (ver sección "RESUELTO" arriba). Falta decidir si lo prioriza el equipo y confirmar con el prospecto que efectivamente lo necesita antes de construirlo.
- [ ] Evaluar si conviene soportar ingesta automática de archivos (carpeta compartida o API) desde un software de pedidos externo, en vez de requerir upload manual a `/upload` — depende de qué tan atado esté el cliente a su software actual.
- [ ] Evaluar si vale la pena un "Historial" con más trazabilidad (por etiqueta individual, no solo por trabajo) — BarTender tiene "History Explorer" nativo, nosotros no.
- [ ] Si en el futuro apuntamos a carnicerías/verdulerías/fiambrerías: BarTender soporta integración nativa con balanzas — anotado para no reinventar la rueda si surge esa necesidad.
- [ ] Si crecemos hacia logística/mayoristas: evaluar sumar ITF-14, GS1-128 y PDF417 como simbologías adicionales (hoy solo tenemos Code128/EAN-13/EAN-8/Code39/DataMatrix/QR).
