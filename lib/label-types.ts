// Shared label element types used across editor, preview and ZPL generator

export type ElementType = "text" | "qr" | "barcode" | "image" | "serial"
export type BarcodeType = "code128" | "ean13" | "ean8" | "code39" | "datamatrix"

export interface LabelElement {
  id: string
  type: ElementType
  content: string
  x: number
  y: number
  fontSize: number
  bold: boolean
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
}

export interface CanvasData {
  elements: LabelElement[]
  cutBetweenLabels?: boolean
  cutEveryN?: number
}
