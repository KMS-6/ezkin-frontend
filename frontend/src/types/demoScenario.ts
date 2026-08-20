export type DemoScenario = 'long_term'
export type ExperienceMode = 'normal' | DemoScenario

export interface DemoScenarioOption {
  id: DemoScenario
  label: string
  description: string
  userId: string
  personaId: string
}
