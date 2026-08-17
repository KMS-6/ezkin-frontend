import { createMockSkinScanResult } from '../mocks/skinScan'
import type { RecentTriggerAnalysisReference, SkinScanResult } from '../types/skinScan'
import { getScanTimestamp } from '../utils/appDateTime'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'
const TRIGGER_REFERENCE_STORAGE_KEY = 'ezkin:trigger-analysis-references'
const latestResultByUser = new Map<string, SkinScanResult>()

function readTriggerReferences(): Record<string, RecentTriggerAnalysisReference> {
  const saved = localStorage.getItem(TRIGGER_REFERENCE_STORAGE_KEY)
  if (!saved) return {}

  try {
    return JSON.parse(saved) as Record<string, RecentTriggerAnalysisReference>
  } catch {
    return {}
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function analyzeSkin(image: Blob | File, userId?: string): Promise<SkinScanResult> {
  if (image.size === 0) throw new Error('A captured image is required for skin analysis.')

  if (USE_MOCK_API) {
    await wait(1100)
    return createMockSkinScanResult(getScanTimestamp(userId))
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

export function rememberLatestSkinScanResult(userId: string, result: SkinScanResult): void {
  latestResultByUser.set(userId, result)
  rememberTriggerAnalysisReference(userId, { scanId: result.id, capturedAt: result.capturedAt })
}

export function rememberTriggerAnalysisReference(
  userId: string,
  reference: RecentTriggerAnalysisReference,
): void {
  const references = readTriggerReferences()
  localStorage.setItem(TRIGGER_REFERENCE_STORAGE_KEY, JSON.stringify({
    ...references,
    [userId]: reference,
  }))
}

export function getLatestSkinScanResult(userId: string): SkinScanResult | null {
  return latestResultByUser.get(userId) ?? null
}

export function getRecentTriggerAnalysisReference(userId: string): RecentTriggerAnalysisReference | null {
  const reference = readTriggerReferences()[userId]
  if (!reference || typeof reference.scanId !== 'string' || typeof reference.capturedAt !== 'string') return null
  return reference
}

export function clearRecentTriggerAnalysisReference(userId: string): void {
  latestResultByUser.delete(userId)
  const references = readTriggerReferences()
  if (!(userId in references)) return

  const next = { ...references }
  delete next[userId]
  localStorage.setItem(TRIGGER_REFERENCE_STORAGE_KEY, JSON.stringify(next))
}
