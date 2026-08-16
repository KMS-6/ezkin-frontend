import type { DietChoice } from '../types/androidNotification'

export const DIET_CHOICE_OPTIONS: Array<{ label: string; value: DietChoice }> = [
  { label: '평소대로', value: 'normal' },
  { label: '매운 음식', value: 'spicy' },
  { label: '야식', value: 'late_night_meal' },
]

const DIET_CHOICE_LABELS: Record<DietChoice, string> = {
  normal: '평소대로',
  spicy: '매운 음식',
  late_night_meal: '야식',
}

export function formatDietChoice(choice: DietChoice): string {
  return DIET_CHOICE_LABELS[choice]
}
