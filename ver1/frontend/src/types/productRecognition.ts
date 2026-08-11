import type { Product } from './product'

export type ProductAddStep =
  | 'intro'
  | 'camera'
  | 'preview'
  | 'analyzing'
  | 'confirm'
  | 'candidates'
  | 'notFound'
  | 'fallback'
  | 'complete'

export type ProductImageSource = 'camera' | 'library'

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
