import type { Product } from './product'

export type ProductAddStep =
  | 'intro'
  | 'requestingPermission'
  | 'camera'
  | 'cameraError'
  | 'preview'
  | 'analyzing'
  | 'confirm'
  | 'candidates'
  | 'notFound'
  | 'fallback'
  | 'complete'

export type ProductImageSource = 'camera' | 'library'

export type ProductCameraErrorCode =
  | 'permission_denied'
  | 'unsupported'
  | 'camera_unavailable'
  | 'capture_failed'

export interface RecognitionCandidate {
  productId?: string
  brand: string
  productName: string
  category: string
  ingredients?: string[]
}

export type ProductRecognitionResult =
  | { status: 'match'; candidate: RecognitionCandidate }
  | { status: 'candidates'; candidates: RecognitionCandidate[] }
  | { status: 'not_found'; candidates: [] }

export interface ProductRecognitionOptions {
  source: ProductImageSource
  availableProducts: Product[]
}
