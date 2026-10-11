"use client"

import type { LabelElement } from "@/lib/label-types"
import { serialValue } from "@/lib/zpl"

interface Props {
  element: LabelElement
  onChange: (patch: Partial<LabelElement>) => void
}

// EAN-13/EAN-8 take the digits WITHOUT the check digit — the printer appends it.
const DIGITS_BY_TYPE: Record<string, number> = { ean13: 12, ean8: 7 }

const input =
  "w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"

// "Numerar automáticamente" for a barcode: each printed label gets the next
// number in the series instead of a value from the Excel. Shared by the
// create and edit template editors.
export function BarcodeAutoNumber({ element, onChange }: Props) {
  const on = !!element.autoNumber
  const type = element.barcodeType ?? "code128"
  const recommended = DIGITS_BY_TYPE[type]

  const toggle = (checked: boolean) => {
    if (!checked) return onChange({ autoNumber: false })
    onChange({
      autoNumber: true,
      serialStart: element.serialStart ?? 1,
      serialIncrement: element.serialIncrement ?? 1,
      serialDigits: element.serialDigits ?? recommended ?? 6,
      serialPrefix: element.serialPrefix ?? "",
      serialSuffix: element.serialSuffix ?? "",
    })
  }

  const sample = on
    ? [0, 1, 2].map((i) => serialValue(element, i)).join(" · ")
    : ""

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border p-3">
      <label className="flex cursor-pointer items-start gap-2 text-xs font-medium text-foreground">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        <span>
          Numerar automáticamente
          <span className="block font-normal text-muted-foreground">
            Cada etiqueta sale con el número siguiente, sin usar el Excel.
          </span>
        </span>
      </label>

      {on && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Número inicial</label>
              <input type="number" className={input} value={element.serialStart ?? 1}
                onChange={(e) => onChange({ serialStart: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Incremento</label>
              <input type="number" min={1} className={input} value={element.serialIncrement ?? 1}
                onChange={(e) => onChange({ serialIncrement: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Dígitos</label>
              <input type="number" min={1} max={14} className={input} value={element.serialDigits ?? 6}
                onChange={(e) => onChange({ serialDigits: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Prefijo</label>
              <input type="text" className={input} value={element.serialPrefix ?? ""} placeholder="PRD-"
                onChange={(e) => onChange({ serialPrefix: e.target.value })} />
            </div>
          </div>
          <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
            Salen: <strong>{sample}</strong>…
          </p>
          {recommended && (
            <p className="text-[11px] text-amber-600">
              {type === "ean13" ? "EAN-13" : "EAN-8"} necesita exactamente <strong>{recommended} dígitos</strong> (sin prefijo con letras): la impresora agrega el verificador sola.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Ojo: si volvés a imprimir, la serie arranca de nuevo desde el número inicial. Para que un producto conserve siempre el mismo código, usá una columna del Excel.
          </p>
        </>
      )}
    </div>
  )
}
