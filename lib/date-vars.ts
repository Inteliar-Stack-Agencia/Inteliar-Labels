// Resolve dynamic date/time variables in label content
// Supported: {{hoy}}, {{hoy+3d}}, {{hoy-1d}}, {{hora}}, {{mes}}, {{año}}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

// True when `key` is a dynamic date/time token (hoy, hoy+3d, hora, mes, año...)
// so it can be excluded from data-column substitution.
export function isDateToken(key: string): boolean {
  return /^(hoy|mañana|hora|mes|año)([+-]\d+d)?$/i.test(key.trim())
}

export function resolveDateVars(text: string, now: Date = new Date()): string {
  return text.replace(/\{\{(hoy|mañana|hora|mes|año)([+-]\d+[d])?\}\}/gi, (match, name, offset) => {
    const d = new Date(now)
    const lname = name.toLowerCase()

    if (offset) {
      const m = offset.match(/([+-])(\d+)d/)
      if (m) {
        const delta = parseInt(m[2]) * (m[1] === "+" ? 1 : -1)
        d.setDate(d.getDate() + delta)
      }
    }

    if (lname === "hora") {
      return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    }
    if (lname === "mes") {
      return d.toLocaleDateString("es-AR", { month: "long" })
    }
    if (lname === "año") {
      return String(d.getFullYear())
    }
    if (lname === "mañana") {
      d.setDate(d.getDate() + 1)
      return formatDate(d)
    }
    return formatDate(d)
  })
}

// Shortcut variables shown as buttons in the editor
export const DATE_SHORTCUTS = [
  { label: "Hoy", variable: "{{hoy}}", description: "Fecha de hoy" },
  { label: "+3 días", variable: "{{hoy+3d}}", description: "Hoy + 3 días (vto. corto)" },
  { label: "+7 días", variable: "{{hoy+7d}}", description: "Hoy + 7 días" },
  { label: "+30 días", variable: "{{hoy+30d}}", description: "Hoy + 30 días" },
  { label: "Hora", variable: "{{hora}}", description: "Hora actual" },
]
