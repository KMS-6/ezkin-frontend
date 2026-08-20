import { useState } from 'react'
import type { DemoScenario } from '../../types/demoScenario'
import {
  activateNormalMode,
  activateDemoScenario,
  demoScenarioOptions,
  getActiveDemoScenario,
  isDemoScenarioEnabled,
} from '../../services/demoScenarioService'

interface DemoScenarioSwitchProps {
  userId: string
}

export function DemoScenarioSwitch({ userId }: DemoScenarioSwitchProps) {
  const [switchingScenario, setSwitchingScenario] = useState<DemoScenario | 'normal' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const activeScenario = getActiveDemoScenario(userId)

  if (!isDemoScenarioEnabled()) return null

  const handleSwitch = async (scenario: DemoScenario | null) => {
    if (switchingScenario || scenario === activeScenario) return
    const selection = scenario ?? 'normal'
    setSwitchingScenario(selection)
    setError(null)

    try {
      if (scenario) await activateDemoScenario(scenario)
      else await activateNormalMode()
      window.location.assign('/')
    } catch {
      setError('시나리오를 바꾸지 못했어요.')
      setSwitchingScenario(null)
    }
  }

  const activeLabel = demoScenarioOptions.find((option) => option.id === activeScenario)?.label ?? '일반 사용자'

  return (
    <section className="mt-7 border-t border-ez-border pt-6" aria-labelledby="demo-scenario-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="demo-scenario-title" className="text-[14px] font-semibold text-ez-text">Demo Scenario</h2>
        <p className="text-[11px] font-medium text-ez-muted">
          현재: {activeLabel}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-[14px] bg-ez-primary-soft/70 p-1" role="group" aria-label="Demo Scenario 선택">
        <button
          type="button"
          onClick={() => void handleSwitch(null)}
          disabled={Boolean(switchingScenario) || activeScenario === null}
          aria-pressed={activeScenario === null}
          className={`min-h-12 rounded-[11px] px-2 text-[11px] font-semibold leading-4 transition ${
            activeScenario === null
              ? 'bg-white text-ez-primary shadow-[0_1px_5px_rgba(55,39,94,0.06)]'
              : 'text-ez-muted hover:text-ez-primary'
          } disabled:cursor-default`}
        >
          {switchingScenario === 'normal' ? '전환 중' : '일반 사용자'}
        </button>
        {demoScenarioOptions.map((option) => {
          const isActive = option.id === activeScenario
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => void handleSwitch(option.id)}
              disabled={Boolean(switchingScenario) || isActive}
              aria-pressed={isActive}
              className={`min-h-12 rounded-[11px] px-2 text-[11px] font-semibold leading-4 transition ${
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
