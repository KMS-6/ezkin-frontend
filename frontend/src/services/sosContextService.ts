import type { SOSContext } from '../types/sos'
import { getTodayBriefing } from './briefingService'
import { getTodayLifeLog } from './lifeLogService'
import { getOnboardingProfile } from './onboardingService'
import { getTodayProductRecommendations } from './productService'
import { isBriefingAvailableForUser } from './userFeatureAvailability'
import { getMockPersona } from '../mocks/personas'

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
  const persona = getMockPersona(userId)

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
    ...(persona?.pattern_analysis?.observed_pattern?.text ? {
      latestScan: {
        summary: persona.pattern_analysis.observed_pattern.text,
      },
    } : {}),
  }
}
