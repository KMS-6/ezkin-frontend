import { createMockSkinScanResult } from '../mocks/skinScan'
import type { SkinScanResult } from '../types/skinScan'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function analyzeSkin(image: Blob | File): Promise<SkinScanResult> {
  if (image.size === 0) throw new Error('A captured image is required for skin analysis.')

  if (USE_MOCK_API) {
    await wait(1100)
    return createMockSkinScanResult()
  }

  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')

  const body = new FormData()
  body.append('image', image, image instanceof File ? image.name : 'skin-scan.jpg')
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}/skin-scans/analyze`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  })

  if (!response.ok) throw new Error('피부 스캔을 분석하지 못했어요.')
  return response.json() as Promise<SkinScanResult>
}
