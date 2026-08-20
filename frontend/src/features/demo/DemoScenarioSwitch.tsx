import { useState } from 'react'
import type { DemoScenario } from '../../types/demoScenario'
import {
  activateNormalMode,
  activateDemoScenario,
  demoScenarioOptions,
  getActiveDemoScenario,
} from '../../services/demoScenarioService'
import { connectWeatherData } from '../../services/weatherConnectionService'

export function DemoScenarioSwitch() {
  const [switchingScenario, setSwitchingScenario] = useState<DemoScenario | 'normal' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const activeScenario = getActiveDemoScenario()

  const handleSwitch = async (scenario: DemoScenario | null) => {
    if (switchingScenario || scenario === activeScenario) return
    const selection = scenario ?? 'normal'
    setSwitchingScenario(selection)
    setError(null)

    try {
      if (scenario) {
        const demoUser = await activateDemoScenario(scenario)
        await connectWeatherData(demoUser.id)
      } else {
        await activateNormalMode()
      }
      window.location.assign('/')
    } catch {
      setError('시나리오를 바꾸지 못했어요.')
      setSwitchingScenario(null)
    }
  }

  const longTermOption = demoScenarioOptions[0]

  return (
    <section className="mt-7 border-t border-ez-border pt-6" aria-labelledby="experience-mode-title">
      <h2 id="experience-mode-title" className="text-[14px] font-semibold text-ez-text">체험 모드</h2>

      <div className="mt-3 overflow-hidden rounded-[16px] border border-ez-border bg-white" role="radiogroup" aria-label="체험 모드 선택">
        <button
          type="button"
          onClick={() => void handleSwitch(null)}
          disabled={Boolean(switchingScenario) || activeScenario === null}
          aria-pressed={activeScenario === null}
          role="radio"
          aria-checked={activeScenario === null}
          className={`w-full px-4 py-3.5 text-left transition ${
            activeScenario === null
              ? 'bg-ez-primary-soft/55'
              : 'hover:bg-ez-primary-soft/25'
          } disabled:cursor-default`}
        >
          <span className={`block text-[13px] font-semibold ${activeScenario === null ? 'text-ez-primary' : 'text-ez-text'}`}>
            {switchingScenario === 'normal' ? '전환 중' : '일반 사용자'}
          </span>
          <span className="mt-1 block text-[11px] font-normal leading-5 text-ez-muted">
            내가 입력한 피부·생활 기록을 기기에 저장해 사용합니다.
          </span>
        </button>
        <button
          type="button"
          onClick={() => void handleSwitch(longTermOption.id)}
          disabled={Boolean(switchingScenario) || activeScenario === longTermOption.id}
          aria-pressed={activeScenario === longTermOption.id}
          role="radio"
          aria-checked={activeScenario === longTermOption.id}
          className={`w-full border-t border-ez-border px-4 py-3.5 text-left transition ${
            activeScenario === longTermOption.id
              ? 'bg-ez-primary-soft/55'
              : 'hover:bg-ez-primary-soft/25'
          } disabled:cursor-default`}
        >
          <span className={`block text-[13px] font-semibold ${activeScenario === longTermOption.id ? 'text-ez-primary' : 'text-ez-text'}`}>
            {switchingScenario === longTermOption.id ? '전환 중' : longTermOption.label}
          </span>
          <span className="mt-1 block text-[11px] font-normal leading-5 text-ez-muted">
            {longTermOption.description}
          </span>
        </button>
      </div>

      {error && <p className="mt-2 text-[11px] font-medium text-ez-danger" role="alert">{error}</p>}
    </section>
  )
}
