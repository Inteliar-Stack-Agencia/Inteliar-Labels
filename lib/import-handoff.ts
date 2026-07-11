// Shared sessionStorage handoff so /integraciones can hand imported rows off
// to /upload's existing editor/template-selection flow without duplicating
// that state machine on a second page.
export const IMPORT_HANDOFF_KEY = "import_handoff"

export interface ImportHandoff {
  columns: string[]
  rows: Record<string, string>[]
  fileName: string
  totalRows: number
}
