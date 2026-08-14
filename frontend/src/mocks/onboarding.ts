import type {
  ConcernOption,
  Gender,
  HealthConcern,
  SkinType,
} from '../types/onboarding'

export const concernOptions: ConcernOption[] = [
  { id: 'breakouts', label: '트러블' },
  { id: 'dryness', label: '건조함' },
  { id: 'oiliness', label: '유분' },
  { id: 'redness', label: '붉음' },
  { id: 'sensitivity', label: '민감함' },
  { id: 'texture', label: '피부결' },
  { id: 'dullness', label: '칙칙함' },
]

export const genderOptions: Array<{ id: Gender; label: string }> = [
  { id: 'female', label: '여성' },
  { id: 'male', label: '남성' },
  { id: 'other', label: '기타' },
  { id: 'prefer_not_to_say', label: '응답하지 않음' },
]

export const healthConcernOptions: Array<{ id: HealthConcern; label: string }> = [
  { id: 'irregular_sleep', label: '수면이 불규칙해요' },
  { id: 'high_stress', label: '스트레스가 많은 편이에요' },
  { id: 'cycle_related', label: '생리 주기에 따라 달라져요' },
  { id: 'allergy_sensitivity', label: '알레르기·민감 반응이 걱정돼요' },
  { id: 'none', label: '특별히 없어요' },
]

export const skinTypeOptions: Array<{ id: SkinType; label: string }> = [
  { id: 'dry', label: '건성' },
  { id: 'oily', label: '지성' },
  { id: 'combination', label: '복합성' },
  { id: 'normal', label: '중성' },
  { id: 'unknown', label: '잘 모르겠어요' },
]
