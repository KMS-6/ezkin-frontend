import type { BadgeTone } from '../../types/briefing'
import type { ProductRecommendationStatus, RecommendedTime } from '../../types/product'

export function getStatusPresentation(status: ProductRecommendationStatus): {
  label: string
  detailLabel: string
  tone: BadgeTone
} {
  if (status === 'recommended') {
    return { label: '오늘 추천', detailLabel: '오늘 추천', tone: 'primary' }
  }
  if (status === 'pause') {
    return { label: '오늘 쉬기', detailLabel: '오늘은 쉬어요', tone: 'neutral' }
  }
  return { label: '사용 가능', detailLabel: '평소처럼 사용해요', tone: 'success' }
}

export function getRecommendedTimeLabel(time?: RecommendedTime): string {
  if (time === 'AM') return 'AM'
  if (time === 'PM') return 'PM'
  return 'AM · PM'
}
