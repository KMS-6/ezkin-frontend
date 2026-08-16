export type DemoScenario = 'A' | 'B' | 'C'

export interface DemoScenarioOption {
  id: DemoScenario
  label: string
  userId: string
  personaId: string
}
