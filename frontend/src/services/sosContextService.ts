import type { SOSContext } from '../types/sos'
import { getTodayBriefing } from './briefingService'
import { getTodayLifeLog } from './lifeLogService'
import { getOnboardingProfile } from './onboardingService'
import { getTodayProductRecommendations } from './productService'
import { isBriefingAvailableForUser } from './userFeatureAvailability'

export async function getSOSContext(userId: string): Promise<SOSContext> {
  const [profile, briefing, lifeLog, productRecommendations] = await Promise.all([
    getOnboardingProfile(userId),
    isBriefingAvailableForUser(userId) ? getTodayBriefing(userId) : Promise.resolve(null),
    getTodayLifeLog(userId),
    getTodayProductRecommendations(userId),
  ])

  const sleep = lifeLog.lifestyleEntries.find((entry) => entry.type === 'sleep')
  const humidity = lifeLog.environmentEntries.find((entry) => entry.type === 'humidity')
  const uv = lifeLog.environmentEntries.find((entry) => entry.type === 'uv')
  const temperature = lifeLog.environmentEntries.find((entry) => entry.type === 'temperature')
  const diet = lifeLog.manualEntries.find((entry) => entry.type === 'diet')

  return {
    userId,
    userProfile: {
      nickname: profile.nickname,
      birthYear: profile.birthYear,
      gender: profile.gender,
      skinType: profile.skinType,
      selectedConcerns: profile.selectedConcerns,
      healthConcerns: profile.healthConcerns,
    },
    today: {
      ...(briefing ? { skinStatus: `${briefing.skinHeadline} · ${briefing.riskLabel}` } : {}),
      sleep: sleep?.value,
      humidity: humidity?.value,
      uv: uv?.value,
      temperature: temperature ? Number(temperature.value) : briefing?.weather.temperature,
      foodChoice: diet?.value,
    },
    products: productRecommendations.map(({ product, recommendation }) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      recommendationStatus: recommendation.status,
    })),
    // latestScan은 Backend 1의 사용자별 Scan History API가 연결되면 이 Service에서 조합합니다.
  }
}
