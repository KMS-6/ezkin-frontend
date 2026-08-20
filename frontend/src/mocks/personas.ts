import type { MockPersonaData, MockPersonaId, PersonaProfileSeed } from '../types/mockPersona'

const DISCLAIMER = '통계적 인과관계나 의료 진단이 아닌 예방적 참고용 관찰입니다.'

export const mockPersonas: Record<MockPersonaId, MockPersonaData> = {
  persona_a1_seoyeon: {
    persona_id: 'persona_a1_seoyeon',
    scenario_type: 'NO_WATCH_FIRST_USE',
    display_name: '박서연',
    birth_year: 2002,
    service_usage_days: 1,
    watch_connected: false,
    baseline_established: false,
    health_concerns: ['irregular_sleep'],
    skin_type: 'unknown',
    skin_concerns: ['breakouts', 'oiliness'],
    product_ids: ['prod_cleanser_a', 'prod_toner_h_soothing', 'prod_toner_e_niacinamide'],
    product_recommendations: [
      { productId: 'prod_cleanser_a', status: 'recommended', summary: '부드럽게 세안해요.', reason: '오늘 루틴의 첫 단계예요.', recommendedTime: 'BOTH', routineStep: 1 },
      { productId: 'prod_toner_e_niacinamide', status: 'recommended', summary: 'T존을 가볍게 정돈해요.', reason: '유분 조절에 도움이 돼요.', recommendedTime: 'BOTH', routineStep: 2 },
      { productId: 'prod_toner_h_soothing', status: 'available', summary: '성분 확인 전에는 소량 사용해요.', reason: '아직 확인되지 않은 제품이에요.', recommendedTime: 'BOTH', routineStep: 3 },
    ],
    weather: { observed_at: '2026-08-15T00:00:00Z', temperature_c: 29, humidity_percent: 48, uv_index: 7 },
    skin_scan: { scan_id: 'scn_a1_01', captured_at: '2026-08-15T00:10:00Z' },
    briefing: {
      risk_level: 'moderate',
      headline: '오늘은 T존 유분과 트러블에 신경 써주세요.',
      summary: 'UV 지수 7과 T존 유분이 함께 관찰됐어요.',
    },
    pattern_analysis: null,
    reports: {},
  },
  persona_b1_eunji: {
    persona_id: 'persona_b1_eunji',
    scenario_type: 'WATCH_FIRST_USE',
    display_name: '이은지',
    birth_year: 1999,
    service_usage_days: 3,
    watch_connected: true,
    baseline_established: false,
    health_concerns: ['irregular_sleep', 'cycle_related'],
    skin_type: 'unknown',
    skin_concerns: ['breakouts', 'oiliness'],
    product_ids: ['prod_toner_b_hyal', 'prod_cream_b_ceramide', 'prod_sunscreen_d', 'prod_ampoule_a_vitc'],
    product_recommendations: [
      { productId: 'prod_toner_b_hyal', status: 'recommended', summary: '수분을 먼저 더해요.', reason: '오늘 루틴의 첫 단계예요.', recommendedTime: 'BOTH', routineStep: 1 },
      { productId: 'prod_cream_b_ceramide', status: 'recommended', summary: '보습을 두껍게 마무리해요.', reason: '낮은 습도가 함께 관찰됐어요.', recommendedTime: 'BOTH', routineStep: 2 },
      { productId: 'prod_sunscreen_d', status: 'recommended', summary: '외출 전 사용해요.', reason: 'UV 지수 8.5가 관찰됐어요.', recommendedTime: 'AM', routineStep: 3 },
      { productId: 'prod_ampoule_a_vitc', status: 'pause', summary: '오늘은 쉬어가요.', reason: '오늘은 자극 가능성을 줄여보세요.', recommendedTime: 'AM' },
    ],
    weather: { observed_at: '2026-08-14T21:30:00Z', temperature_c: 27, humidity_percent: 20, uv_index: 8.5 },
    current_health: { collectedAt: '2026-08-14T21:30:00Z', sleep_hours: 4.5, hrv_ms: 28 },
    skin_scan: { scan_id: 'scn_b1_01', captured_at: '2026-08-13T11:30:00Z' },
    briefing: {
      risk_level: 'high',
      headline: '오늘은 피부 자극에 주의해 주세요.',
      summary: '짧은 수면과 야식, 낮은 습도가 함께 관찰됐어요.',
    },
    pattern_analysis: null,
    reports: {},
  },
  persona_c1_minjun: {
    persona_id: 'persona_c1_minjun',
    scenario_type: 'WATCH_LONG_TERM',
    display_name: '최민준',
    birth_year: 1994,
    service_usage_days: 190,
    watch_connected: true,
    baseline_established: true,
    health_concerns: ['irregular_sleep'],
    skin_type: 'unknown',
    skin_concerns: ['dryness', 'breakouts'],
    product_ids: ['prod_oil_g_cleansing', 'prod_toner_e_niacinamide', 'prod_serum_c_retinol', 'prod_cream_b_ceramide', 'prod_cream_f_panthenol', 'prod_sunscreen_d', 'prod_ampoule_a_vitc'],
    product_recommendations: [
      { productId: 'prod_cream_f_panthenol', status: 'recommended', summary: '진정 단계로 시작해요.', reason: '오늘 브리핑에 포함된 제품이에요.', recommendedTime: 'BOTH', routineStep: 1 },
      { productId: 'prod_cream_b_ceramide', status: 'recommended', summary: '보습으로 마무리해요.', reason: '오늘 브리핑에 포함된 제품이에요.', recommendedTime: 'BOTH', routineStep: 2 },
      { productId: 'prod_serum_c_retinol', status: 'pause', summary: '오늘은 쉬어가요.', reason: '오늘은 자극 가능성을 줄여보세요.', recommendedTime: 'PM' },
    ],
    weather: { observed_at: '2026-08-14T22:00:00Z', temperature_c: 26, humidity_percent: 23, uv_index: 2.5 },
    current_health: { collectedAt: '2026-08-14T22:00:00Z', sleep_hours: 4, hrv_ms: 33 },
    health_baseline: { sleep_hours: 6.1, hrv_ms: 50.6 },
    skin_scan: { scan_id: 'scn_c1_20', captured_at: '2026-08-14T08:00:00Z' },
    briefing: {
      risk_level: 'very_high',
      headline: '오늘은 피부가 조금 예민해 보여요.',
      summary: '수면과 HRV가 개인 평균보다 낮고 최근 홍조 상승이 함께 관찰됐어요.',
    },
    pattern_analysis: {
      scan_id: 'scn_c1_20',
      window: { start: '2026-08-11T08:00:00Z', end: '2026-08-14T08:00:00Z' },
      raw_facts: [
        { type: 'sleep', text: '최근 3일 평균 수면 시간이 평소보다 1.8시간 짧았어요.' },
        { type: 'hrv', text: 'HRV가 평소보다 크게 낮은 날이 이틀 연속 있었어요.' },
      ],
      observed_pattern: {
        text: '수면이 짧고 HRV가 낮았던 시기에 홍조 상승이 함께 관찰됐어요.',
      },
      common_knowledge: null,
      disclaimer: DISCLAIMER,
    },
    reports: {
      14: {
        report_id: 'report_c1_14d', status: 'completed', period: 14,
        summary: '수면과 HRV가 낮고 건조했던 시기의 흐름을 정리했어요.',
        observations: [
          { text: '수면 4.0시간이 기록됐어요.', evidence_ids: ['risk_c1_today'] },
          { text: 'HRV 33ms가 기록됐어요.', evidence_ids: ['risk_c1_today'] },
          { text: '습도 23%가 관찰됐어요.', evidence_ids: [] },
        ],
        patterns: [
          { text: '최근 3일 평균 수면 시간이 평소보다 1.8시간 짧았어요.', evidence_ids: ['pat_c1_01'] },
          { text: 'HRV가 평소보다 크게 낮은 날이 이틀 연속 있었어요.', evidence_ids: ['pat_c1_01'] },
        ],
        recommendations: [{ text: '수면과 HRV가 낮은 날의 피부 변화를 계속 함께 살펴보세요.', evidence_ids: ['risk_c1_today', 'pat_c1_01'] }],
        limitations: '생활 데이터와 피부 변화가 함께 나타난 흐름이며, 의학적 인과관계나 진단을 의미하지 않아요.',
        safety_status: 'wellness_only', generated_at: '2026-08-15T06:30:00+09:00',
      },
      30: {
        report_id: 'report_c1_30d', status: 'completed', period: 30,
        summary: '최근 한 달간 수면 저하와 건조한 환경이 겹친 날의 피부 흐름을 정리했어요.',
        observations: [
          { text: '최근 30일 중 수면이 개인 평균보다 짧은 날이 반복됐어요.', evidence_ids: ['risk_c1_30d'] },
          { text: '건조한 환경이 이어진 날에는 피부 당김 기록이 더 자주 나타났어요.', evidence_ids: ['risk_c1_30d'] },
          { text: '최근 기록에서 HRV가 개인 평균보다 낮은 흐름이 관찰됐어요.', evidence_ids: ['pat_c1_30d'] },
        ],
        patterns: [
          { text: '수면과 HRV가 평소보다 낮은 시기에 홍조와 건조 변화가 함께 관찰됐어요.', evidence_ids: ['pat_c1_30d'] },
          { text: '습도가 낮은 날에는 보습 중심 루틴을 사용한 기록이 많았어요.', evidence_ids: ['pat_c1_30d'] },
        ],
        recommendations: [{ text: '컨디션이 낮고 건조한 날에는 자극적인 단계를 줄이고 보습 중심으로 관리해보세요.', evidence_ids: ['risk_c1_30d', 'pat_c1_30d'] }],
        limitations: '최근 30일의 생활·환경 데이터와 피부 변화가 함께 나타난 흐름이며, 의학적 인과관계나 진단을 의미하지 않아요.',
        safety_status: 'wellness_only', generated_at: '2026-08-15T06:35:00+09:00',
      },
    },
  },
}

export function getMockPersona(userId: string): MockPersonaData | null {
  return mockPersonas[userId as MockPersonaId] ?? null
}

export function getPersonaProfileSeed(persona: MockPersonaData): PersonaProfileSeed {
  return {
    currentStep: 5,
    onboardingVersion: 2,
    nickname: persona.display_name,
    birthYear: persona.birth_year,
    gender: null,
    healthConcerns: persona.health_concerns,
    skinType: persona.skin_type,
    selectedConcerns: persona.skin_concerns,
    registeredProductIds: persona.product_ids,
    lifeDataConnected: persona.watch_connected,
    weatherConnected: true,
    completedAt: persona.skin_scan.captured_at,
  }
}
