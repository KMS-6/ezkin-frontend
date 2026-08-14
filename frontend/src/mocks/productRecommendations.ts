import type { TodayProductRecommendation } from '../types/product'

export const todayProductRecommendations: TodayProductRecommendation[] = [
  {
    productId: 'calming-toner',
    status: 'recommended',
    summary: '오늘 피부를 편안하게 시작해요.',
    reason: '오늘은 피부가 평소보다 예민할 수 있어 첫 단계에서 부드럽게 진정하기 좋아요.',
    recommendedTime: 'BOTH',
    routineStep: 1,
  },
  {
    productId: 'hyaluronic-serum',
    status: 'recommended',
    summary: '건조한 공기에 수분을 더해요.',
    reason: '오늘은 습도가 낮아 보습 단계에서 수분을 충분히 더해주기 좋아요.',
    recommendedTime: 'BOTH',
    routineStep: 2,
  },
  {
    productId: 'ceramide-cream',
    status: 'recommended',
    summary: '보습막을 조금 넉넉히 더해요.',
    reason: '오늘은 공기가 건조해서 보습 단계에서 조금 넉넉히 사용해도 좋아요.',
    recommendedTime: 'BOTH',
    routineStep: 3,
  },
  {
    productId: 'spf50-sunscreen',
    status: 'recommended',
    summary: '높은 UV에 대비해요.',
    reason: '오늘은 UV가 높을 것으로 보여 외출 전 루틴에 포함하기 좋아요.',
    recommendedTime: 'AM',
    routineStep: 4,
  },
  {
    productId: 'retinol-serum',
    status: 'pause',
    summary: '오늘은 자극을 조금 덜어볼게요.',
    reason: '오늘은 피부가 평소보다 예민할 수 있어 하루 정도 쉬어가는 것을 추천해요.',
    recommendedTime: 'PM',
    tomorrowNote: '내일 상태가 괜찮아지면 다시 루틴에 포함될 수 있어요.',
  },
  {
    productId: 'vitamin-c-ampoule',
    status: 'pause',
    summary: '오늘은 편안한 루틴을 우선해요.',
    reason: '오늘은 자극 가능성을 조금 덜기 위해 수분·진정 루틴을 먼저 사용해보세요.',
    recommendedTime: 'AM',
    tomorrowNote: '피부가 편안한 날 다시 가볍게 사용할 수 있어요.',
  },
]
