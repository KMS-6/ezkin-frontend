import type { Product } from '../types/product'
import type {
  ProductRecognitionOptions,
  ProductRecognitionResult,
  RecognitionCandidate,
} from '../types/productRecognition'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'

function toCandidate(product: Product): RecognitionCandidate {
  return {
    productId: product.id,
    brand: product.brand,
    productName: product.name,
    category: product.categoryLabel,
    ingredients: product.ingredients.slice(0, 2),
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function recognizeProduct(
  image: Blob | File,
  {
    source,
    availableProducts,
  }: ProductRecognitionOptions,
): Promise<ProductRecognitionResult> {
  if (image.size === 0) {
    throw new Error('An image is required to recognize a product.')
  }

  if (!USE_MOCK_API) {
    if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')
    const body = new FormData()
    body.append('image', image, image instanceof File ? image.name : 'product.jpg')
    const token = localStorage.getItem(TOKEN_KEY)
    const response = await fetch(`${API_BASE_URL}/products/recognize`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    })
    if (!response.ok) throw new Error('제품을 확인하지 못했어요.')
    return response.json() as Promise<ProductRecognitionResult>
  }

  await wait(750)

  if (availableProducts.length === 0) {
    return { status: 'not_found', candidates: [] }
  }

  const candidates = availableProducts.slice(0, 3).map(toCandidate)
  if (source === 'library' && candidates.length > 1) {
    return { status: 'candidates', candidates }
  }

  return { status: 'match', candidate: candidates[0] }
}
