export const SCAN_COUNTDOWN_NUMBER_MS = 700
export const SCAN_COUNTDOWN_FINAL_DELAY_MS = 100

export function getScanCountdownDelay(countdown: number): number {
  return countdown === 1 ? SCAN_COUNTDOWN_FINAL_DELAY_MS : SCAN_COUNTDOWN_NUMBER_MS
}
