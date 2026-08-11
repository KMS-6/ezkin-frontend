import type { Product } from '../types/product'
import type {
  ProductRecognitionOptions,
  ProductRecognitionResult,
  RecognitionCandidate,
} from '../types/productRecognition'

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
