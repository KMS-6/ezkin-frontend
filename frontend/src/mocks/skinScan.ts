import type { SkinScanResult } from '../types/skinScan'

export function createMockSkinScanResult(capturedAt: string): SkinScanResult {
  return {
    id: crypto.randomUUID(),
    capturedAt,
    overallStatus: '조금 예민해 보여요.',
    observedAreas: ['턱 주변', '볼 주변'],
    summary: '오늘은 장벽을 쉬게 해주세요.',
    recommendation: '자극적인 단계보다 보습·진정 중심으로 가볍게 관리해보세요.',
  }
}
