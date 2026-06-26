# Inteliar Printer Agent v2

Puente local entre el SaaS de etiquetas y las impresoras térmicas.  
Soporta múltiples impresoras, múltiples conexiones y múltiples marcas simultáneamente.

## Instalación

```bash
cd printer-agent
npm install
npm start          # producción
npm run dev        # desarrollo (reinicio automático)
```

Puerto por defecto: **9638**. Cambiar con variable `AGENT_PORT`.

---

## Configuración de impresoras

Las impresoras se guardan en `printer-agent/printers.json` (persistente).  
Se pueden gestionar vía API REST o editando el archivo directamente.

### POST /printers — Agregar / actualizar impresora

```json
{
  "id":         "honeywell1",
  "name":       "Honeywell PC42tp",
  "brand":      "honeywell",
  "connection": "tcp",
  "language":   "zpl",
  "host":       "192.168.1.100",
  "port":       9100
}
```

### Campos de configuración

| Campo        | Valores                          | Descripción                              |
|--------------|----------------------------------|------------------------------------------|
| `id`         | string único                     | Identificador interno                    |
| `name`       | string                           | Nombre para mostrar                      |
| `brand`      | `zebra` `honeywell` `tsc` `citizen` `sato` `bixolon` `generic` | Marca |
| `connection` | `tcp` `usb` `serial` `simulate`  | Tipo de conexión                         |
| `language`   | `zpl` `tspl` `cpcl` `sbpl` `auto` | Lenguaje de impresión (auto = detectar) |
| `host`       | IP o hostname                    | Para conexión TCP/IP                     |
| `port`       | número (default 9100)            | Puerto TCP/IP                            |
| `usbQueue`   | string                           | Nombre de cola Windows/Linux             |
| `serialPort` | `COM1` `/dev/ttyUSB0`            | Puerto serie                             |
| `baudRate`   | número (default 9600)            | Velocidad serie                          |

---

## Ejemplos por marca y conexión

### Zebra — Red TCP/IP (ZPL)
```json
{
  "id": "zebra-red", "name": "Zebra ZD421", "brand": "zebra",
  "connection": "tcp", "language": "zpl",
  "host": "192.168.1.50", "port": 9100
}
```

### Honeywell PC42tp — Red TCP/IP (ZPL/Autosense)
```json
{
  "id": "honeywell1", "name": "Honeywell PC42tp", "brand": "honeywell",
  "connection": "tcp", "language": "zpl",
  "host": "192.168.1.100", "port": 9100
}
```

### Honeywell PC42tp — USB en Windows
```json
{
  "id": "honeywell-usb", "name": "Honeywell PC42tp USB", "brand": "honeywell",
  "connection": "usb", "language": "zpl",
  "usbQueue": "Honeywell PC42 (USB)"
}
```
> El nombre de `usbQueue` debe coincidir exactamente con el nombre de la impresora en Windows (Panel de Control → Dispositivos e impresoras).

### TSC — USB en Linux
```json
{
  "id": "tsc1", "name": "TSC TTP-244 Plus", "brand": "tsc",
  "connection": "usb", "language": "tspl",
  "usbQueue": "TSC_TTP244"
}
```

### Citizen — Puerto Serie (RS-232)
```json
{
  "id": "citizen-serial", "name": "Citizen CL-S521", "brand": "citizen",
  "connection": "serial", "language": "zpl",
  "serialPort": "COM3", "baudRate": 9600
}
```
> Requiere instalar el módulo: `npm install serialport`

### Simulador (para desarrollo/pruebas)
```json
{
  "id": "sim", "name": "Simulador", "brand": "generic",
  "connection": "simulate", "language": "zpl"
}
```

---

## API Endpoints

| Método | Ruta                        | Descripción                                  |
|--------|-----------------------------|----------------------------------------------|
| GET    | `/status`                   | Estado del agente y impresora por defecto    |
| GET    | `/printers`                 | Lista todas las impresoras configuradas       |
| POST   | `/printers`                 | Agregar / actualizar impresora               |
| DELETE | `/printers/:id`             | Eliminar impresora                           |
| POST   | `/printers/:id/default`     | Establecer como impresora por defecto        |
| POST   | `/printers/:id/test`        | Imprimir etiqueta de prueba                  |
| GET    | `/discover/usb`             | Detectar colas de impresión del sistema      |
| GET    | `/discover/network?subnet=192.168.1` | Escanear red buscando impresoras TCP port 9100 |
| POST   | `/print`                    | Imprimir en impresora por defecto            |
| POST   | `/print/:id`                | Imprimir en impresora específica             |
| GET    | `/log`                      | Últimos 100 trabajos de impresión            |

### POST /print — Body

```json
{
  "data": "^XA^FO20,20^FDHola^FS^XZ",
  "printerId": "honeywell1"
}
```
`printerId` es opcional; si se omite usa la impresora por defecto.

---

## Conectar la Honeywell PC42tp por red

1. Conectar cable Ethernet al router y a la impresora
2. En PrintSet 5: clic derecho sobre la impresora → **Propiedades** → **Puertos**
3. Agregar puerto TCP/IP → ingresar la IP asignada por el router
4. Configurar IP estática en el router (DHCP reservado por MAC `00:0D:70:15:7E:AB`)
5. Agregar la impresora al agente:
   ```bash
   curl -X POST http://localhost:9638/printers \
     -H "Content-Type: application/json" \
     -d '{"id":"honeywell1","name":"Honeywell PC42tp","brand":"honeywell","connection":"tcp","language":"zpl","host":"192.168.1.100","port":9100}'
   ```
6. Probar:
   ```bash
   curl -X POST http://localhost:9638/printers/honeywell1/test
   ```
