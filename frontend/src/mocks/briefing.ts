import type { BriefingData } from '../types/briefing'

export const todayBriefingMock: BriefingData = {
  greeting: '좋은 아침이에요',
  dateLabel: '8월 11일 · 화요일',
  weather: { temperature: 31, humidity: 28 },
  skinHeadline: '장벽을 쉬게 해주는 날',
  riskLabel: '자극 위험도 높음',
  summary:
    '간밤 수면이 짧았고 오늘 공기가 건조해 피부가 평소보다 예민할 수 있어요.',
  careTip: '자극은 덜고, 보습은 조금 더.',
  metrics: [
    { id: 'sleep', label: '수면', value: '4h 12m', icon: 'sleep', source: 'health', description: '평소보다 짧았어요.' },
    { id: 'humidity', label: '습도', value: '28%', icon: 'humidity', source: 'environment', description: '오늘 공기가 건조해요.' },
    { id: 'uv', label: 'UV', value: '9.0', icon: 'uv', source: 'environment', description: '외출할 때 자외선이 강한 날이에요.' },
  ],
  syncedSources: ['수면', 'HRV', '날씨', 'UV'],
  syncedCount: 12,
}
