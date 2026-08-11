import type { LifeLogEntry } from '../types/lifeLog'

type AdditionalLifeLogEntry = Omit<LifeLogEntry, 'source' | 'sourceLabel'>

export const additionalLifestyleMock: AdditionalLifeLogEntry[] = [
  {
    id: 'steps',
    type: 'steps',
    label: '걸음',
    value: '3,204',
    description: '오늘 활동',
  },
  {
    id: 'rhythm',
    type: 'rhythm',
    label: '생활 리듬',
    value: '평소보다 늦음',
    description: '늦은 취침이 함께 관찰됐어요.',
  },
]

export const additionalEnvironmentMock: AdditionalLifeLogEntry[] = [
  {
    id: 'pm25',
    type: 'pm25',
    label: 'PM2.5',
    value: '54',
    description: '오늘의 미세먼지',
  },
]
