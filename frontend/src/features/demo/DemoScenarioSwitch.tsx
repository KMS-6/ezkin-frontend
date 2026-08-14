import { useState } from 'react'
import type { DemoScenario } from '../../types/demoScenario'
import {
  activateDemoScenario,
  demoScenarioOptions,
  getActiveDemoScenario,
  isDemoScenarioEnabled,
} from '../../services/demoScenarioService'

interface DemoScenarioSwitchProps {
  userId: string
}

export function DemoScenarioSwitch({ userId }: DemoScenarioSwitchProps) {
  const [switchingScenario, setSwitchingScenario] = useState<DemoScenario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const activeScenario = getActiveDemoScenario(userId)

  if (!isDemoScenarioEnabled()) return null

  const handleSwitch = async (scenario: DemoScenario) => {
    if (switchingScenario || (scenario === activeScenario && scenario !== 'first')) return
    setSwitchingScenario(scenario)
    setError(null)

    try {
      await activateDemoScenario(scenario, { resetFirst: scenario === 'first' })
      window.location.assign('/')
    } catch {
      setError('시나리오를 바꾸지 못했어요.')
      setSwitchingScenario(null)
    }
  }

  const activeLabel = demoScenarioOptions.find((option) => option.id === activeScenario)?.label

  return (
    <section className="mt-7 border-t border-ez-border pt-6" aria-labelledby="demo-scenario-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="demo-scenario-title" className="text-[14px] font-semibold text-ez-text">Demo Scenario</h2>
        <p className="text-[11px] font-medium text-ez-muted">
          현재: {activeLabel ?? '기존 사용자'}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-[14px] bg-ez-primary-soft/70 p-1" role="group" aria-label="Demo Scenario 선택">
        {demoScenarioOptions.map((option) => {
          const isActive = option.id === activeScenario
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => void handleSwitch(option.id)}
              disabled={Boolean(switchingScenario) || (isActive && option.id !== 'first')}
              aria-pressed={isActive}
              className={`min-h-10 rounded-[11px] px-3 text-[12px] font-semibold transition ${
                isActive
                  ? 'bg-white text-ez-primary shadow-[0_1px_5px_rgba(55,39,94,0.06)]'
                  : 'text-ez-muted hover:text-ez-primary'
              } disabled:cursor-default`}
            >
              {switchingScenario === option.id ? '전환 중' : option.label}
            </button>
          )
        })}
      </div>

      {error && <p className="mt-2 text-[11px] font-medium text-ez-danger" role="alert">{error}</p>}
    </section>
  )
}
