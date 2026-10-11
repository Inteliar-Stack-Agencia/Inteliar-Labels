import { describe, it, expect } from "vitest"
import { generateZPL } from "./zpl"
import type { LabelElement } from "./label-types"

const barcode = (extra: Partial<LabelElement> = {}): LabelElement => ({
  id: "b1", type: "barcode", content: "{{codigo}}", x: 40, y: 40, fontSize: 12, bold: false,
  barcodeType: "code128", autoNumber: true,
  serialStart: 1, serialIncrement: 1, serialDigits: 6, serialPrefix: "", serialSuffix: "",
  ...extra,
})

const tpl = (el: LabelElement) => ({ width_mm: 60, height_mm: 40, canvas_data: { elements: [el] } })
const fds = (zpl: string) => [...zpl.matchAll(/\^BC[^\^]*\^FD([^\^]*)\^FS/g)].map((m) => m[1])

describe("barcode auto-numbering", () => {
  it("prints the next number on every label, ignoring the Excel column", () => {
    const zpl = generateZPL(tpl(barcode()), [{ row_data: { codigo: "IGNORADO" }, quantity: 3 }])
    expect(fds(zpl)).toEqual(["000001", "000002", "000003"])
  })

  it("keeps counting across rows", () => {
    const zpl = generateZPL(tpl(barcode()), [
      { row_data: {}, quantity: 1 },
      { row_data: {}, quantity: 2 },
    ])
    expect(fds(zpl)).toEqual(["000001", "000002", "000003"])
  })

  it("honours start, increment and prefix", () => {
    const zpl = generateZPL(
      tpl(barcode({ serialStart: 1001, serialIncrement: 5, serialDigits: 4, serialPrefix: "PRD-" })),
      [{ row_data: {}, quantity: 2 }]
    )
    expect(fds(zpl)).toEqual(["PRD-1001", "PRD-1006"])
  })

  it("continues the series when resuming from label N", () => {
    const zpl = generateZPL(tpl(barcode()), [{ row_data: {}, quantity: 5 }], { startFromLabel: 4 })
    expect(fds(zpl)).toEqual(["000004", "000005"])
  })

  it("still reads the Excel column when auto-number is off", () => {
    const zpl = generateZPL(tpl(barcode({ autoNumber: false })), [
      { row_data: { codigo: "A1" }, quantity: 1 },
      { row_data: { codigo: "B2" }, quantity: 1 },
    ])
    expect(fds(zpl)).toEqual(["A1", "B2"])
  })
})

import { PRESET_TEMPLATES } from "./preset-templates"

describe("preset 'Producto con código de barras numerado'", () => {
  const preset = PRESET_TEMPLATES.find((p) => p.id === "product-auto-barcode")!

  it("only needs the 'producto' variable (no phantom Excel column)", () => {
    const vars = new Set(
      preset.canvas.elements
        .filter((el) => !(el.type === "barcode" && el.autoNumber))
        .flatMap((el) => [...el.content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))
    )
    expect([...vars]).toEqual(["producto"])
  })

  it("prints each product with its own number, honouring cantidad", () => {
    const zpl = generateZPL(
      { width_mm: preset.widthMm, height_mm: preset.heightMm, canvas_data: preset.canvas },
      [
        { row_data: { producto: "Mochila escolar" }, quantity: 2 },
        { row_data: { producto: "Cuaderno A4" }, quantity: 1 },
      ]
    )
    expect(fds(zpl)).toEqual(["000001", "000002", "000003"])
    expect(zpl).toContain("Mochila escolar")
    expect(zpl).toContain("Cuaderno A4")
  })
})

describe("preset product-variant-barcode", () => {
  it("imprime el mismo código en unidades iguales y otro en cada variante", async () => {
    const { PRESET_TEMPLATES } = await import("./preset-templates")
    const preset = PRESET_TEMPLATES.find((p) => p.id === "product-variant-barcode")!
    const zpl = generateZPL(
      { width_mm: preset.widthMm, height_mm: preset.heightMm, canvas_data: preset.canvas },
      [
        { row_data: { producto: "Remera", color: "Negro", talle: "M", codigo: "1001" }, quantity: 3 },
        { row_data: { producto: "Remera", color: "Blanco", talle: "M", codigo: "1003" }, quantity: 1 },
      ]
    )
    expect(zpl.match(/\^FD1001\^FS/g)).toHaveLength(3)
    expect(zpl.match(/\^FD1003\^FS/g)).toHaveLength(1)
    expect(zpl).toContain("Negro - Talle M")
  })
})
