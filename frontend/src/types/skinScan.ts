export type SkinScanState =
  | 'idle'
  | 'requestingPermission'
  | 'camera'
  | 'countdown'
  | 'preview'
  | 'analyzing'
  | 'result'
  | 'error'

export type SkinScanErrorCode =
  | 'permission_denied'
  | 'unsupported'
  | 'camera_unavailable'
  | 'capture_failed'
  | 'analysis_failed'

export interface SkinScanResult {
  id: string
  capturedAt: string
  overallStatus: string
  observedAreas: string[]
  summary: string
  recommendation: string
}
