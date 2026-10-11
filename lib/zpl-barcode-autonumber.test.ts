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
