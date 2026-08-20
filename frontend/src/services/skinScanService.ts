import { createMockSkinScanResult } from '../mocks/skinScan'
import type { RecentTriggerAnalysisReference, SkinScanResult } from '../types/skinScan'
import { getScanTimestamp, isDemoPersonaUser } from '../utils/appDateTime'
import { apiRequest } from './apiClient'
import { requireFeatureAvailable } from './userFeatureAvailability'

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USE_SKIN_SCAN_API = import.meta.env.VITE_USE_SKIN_SCAN_API === 'true'
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

interface SkinScanApiResult {
  scan_id: string
  status: string
  created_at: string
  scores: Record<string, number> | null
  limitation_notice: string | null
  retry_after_seconds: number | null
  failure: { code: string; message: string; retryable: boolean } | null
}

async function waitForSkinScan(scanId: string): Promise<SkinScanApiResult> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const result = await apiRequest<SkinScanApiResult>(`/skin-scans/${scanId}`)
    if (result.status !== 'processing') return result
    await wait(Math.max(1, result.retry_after_seconds ?? 3) * 1000)
  }
  throw new Error('분석이 예상보다 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.')
}

export async function analyzeSkin(image: Blob | File, userId?: string): Promise<SkinScanResult> {
  if (image.size === 0) throw new Error('A captured image is required for skin analysis.')
  requireFeatureAvailable('skinScan', userId)

  const useLiveSkinScan = !isDemoPersonaUser(userId) && (USE_SKIN_SCAN_API || !USE_MOCK_API)
  if (!useLiveSkinScan) {
    await wait(1100)
    return createMockSkinScanResult(getScanTimestamp(userId))
  }

  const body = new FormData()
  body.append('image', image, image instanceof File ? image.name : 'skin-scan.jpg')
  body.append('capture_method', 'camera')
  body.append('captured_at', getScanTimestamp(userId))
  body.append('lighting_ok', 'true')
  const accepted = await apiRequest<{ scan_id: string }>('/skin-scans', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body,
  })
  const result = await waitForSkinScan(accepted.scan_id)
  if (result.status === 'failed') {
    throw new Error(result.failure?.message ?? '피부 스캔을 분석하지 못했어요.')
  }
  const scoreEntries = Object.entries(result.scores ?? {})
  const observedAreas = scoreEntries
    .filter(([, score]) => score >= 0.5)
    .map(([area]) => area)
  const highestScore = scoreEntries.reduce((highest, [, score]) => Math.max(highest, score), 0)
  return {
    id: result.scan_id,
    capturedAt: result.created_at,
    overallStatus: highestScore >= 0.7 ? '주의 관찰' : '안정적',
    observedAreas,
    summary: observedAreas.length > 0 ? `${observedAreas.join(', ')} 변화를 관찰했어요.` : '뚜렷한 변화를 관찰하지 못했어요.',
    recommendation: result.limitation_notice ?? '오늘 상태를 참고해 자극적인 관리는 줄여주세요.',
  }
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
