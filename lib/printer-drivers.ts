/**
 * Catálogo de drivers de impresoras de etiquetas.
 *
 * No alojamos los instaladores: son software propietario de cada fabricante,
 * se actualizan por su cuenta y vienen firmados digitalmente. Guardamos sólo
 * los enlaces a las páginas oficiales de descarga, para que el cliente baje
 * siempre la versión vigente desde la fuente legítima.
 */

export type DriverBrand =
  | "zebra"
  | "honeywell"
  | "tsc"
  | "citizen"
  | "sato"
  | "bixolon"
  | "generic"

export interface DriverEntry {
  brand: DriverBrand
  /** Nombre visible de la marca. */
  label: string
  /** Página oficial de descarga de drivers. */
  url: string
  /** Modelos frecuentes de esta marca, para que el cliente se reconozca. */
  models: string[]
  /** Aclaración específica de la marca, si hace falta. */
  note?: string
}

/**
 * Seagull ("Drivers by Seagull") publica drivers Windows para prácticamente
 * todas las marcas de impresoras de etiquetas, incluidas varias que el
 * fabricante ya no soporta. Es la opción de respaldo cuando el driver oficial
 * no aparece o no funciona.
 */
export const SEAGULL_DRIVERS_URL = "https://www.seagullscientific.com/support/downloads/drivers/"

export const DRIVER_CATALOG: DriverEntry[] = [
  {
    brand: "honeywell",
    label: "Honeywell",
    url: "https://sps.honeywell.com/us/en/support/productivity/software",
    models: ["PC42t", "PC42E-T", "PC43t", "PD43", "PM43"],
    note: "Incluye los modelos que antes eran Intermec y Datamax.",
  },
  {
    brand: "zebra",
    label: "Zebra",
    url: "https://www.zebra.com/us/en/support-downloads/printer-software.html",
    models: ["ZD220", "ZD230", "ZD421", "GK420t", "GC420t", "ZT230"],
  },
  {
    brand: "tsc",
    label: "TSC",
    url: "https://www.tscprinters.com/EN/support",
    models: ["TE200", "TE244", "TTP-244 Pro", "DA210"],
  },
  {
    brand: "citizen",
    label: "Citizen",
    url: "https://www.citizen-systems.co.jp/english/support/download/printer/",
    models: ["CL-E300", "CL-S521", "CL-S631"],
  },
  {
    brand: "sato",
    label: "Sato",
    url: "https://www.satoamerica.com/resources/drivers-downloads",
    models: ["CG408", "WS408", "CL4NX"],
  },
  {
    brand: "bixolon",
    label: "Bixolon",
    url: "https://www.bixolon.com/technical-support/download/",
    models: ["SLP-DX220", "SLP-TX400", "XD5-40d"],
  },
]

/** Busca la entrada del catálogo para una marca. */
export function driverForBrand(brand?: string): DriverEntry | undefined {
  if (!brand) return undefined
  return DRIVER_CATALOG.find((d) => d.brand === brand)
}

/**
 * Deduce la marca a partir del nombre de la cola de impresión de Windows.
 * Sirve para sugerir el driver correcto sin preguntarle nada al cliente.
 */
export function brandFromQueueName(queue: string): DriverBrand {
  const q = queue.toLowerCase()
  if (q.includes("zebra") || /\bz[dt]\d{3}/.test(q) || q.includes("gk420") || q.includes("gc420")) return "zebra"
  if (q.includes("honeywell") || q.includes("intermec") || /\bpc4[23]/.test(q) || q.includes("datamax")) return "honeywell"
  if (q.includes("tsc") || q.includes("ttp-")) return "tsc"
  if (q.includes("citizen") || /\bcl-?[se]\d/.test(q)) return "citizen"
  if (q.includes("sato")) return "sato"
  if (q.includes("bixolon") || q.includes("srp-")) return "bixolon"
  return "generic"
}
