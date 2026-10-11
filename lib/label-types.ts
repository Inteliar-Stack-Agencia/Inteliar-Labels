// Shared label element types used across editor, preview and ZPL generator

export type ElementType = "text" | "qr" | "barcode" | "image" | "serial" | "line" | "rect" | "ellipse"
export type BarcodeType = "code128" | "ean13" | "ean8" | "code39" | "datamatrix"

export interface LabelElement {
  id: string
  type: ElementType
  content: string
  x: number
  y: number
  fontSize: number
  bold: boolean
  textAlign?: "left" | "center" | "right"
  // text / barcode: width of the element's own box in tenths-of-mm. When set,
  // alignment (left/center/right) happens INSIDE this box, anchored at x — so a
  // word can be centered inside a rectangle at any position. When undefined,
  // legacy behaviour applies (center/right align across the whole label).
  boxWidth?: number
  // text: force the resolved content to print in uppercase, regardless of
  // how the value is cased in the Excel column or typed in a static label.
  uppercase?: boolean
  // barcode: print the next number of a series on every label (uses the
  // serial* fields below) instead of a value taken from the Excel.
  autoNumber?: boolean
  // image
  imageUrl?: string
  imgWidth?: number
  imgHeight?: number
  // barcode sub-type
  barcodeType?: BarcodeType
  // serial number
  serialStart?: number
  serialIncrement?: number
  serialDigits?: number
  serialPrefix?: string
  serialSuffix?: string
  // line / rect
  lineWidth?: number     // mm — total width of the shape
  lineHeight?: number    // mm — height (use ~0.5 for a thin line)
  lineThickness?: number // mm — border thickness (rect only)
}

export interface CanvasData {
  elements: LabelElement[]
  cutBetweenLabels?: boolean
  cutEveryN?: number
}
