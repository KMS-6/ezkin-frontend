import { Activity, ArrowRight, CloudSun, Droplets, ScanFace } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Disclaimer } from '../../../components/ui/Disclaimer'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import type { TriggerAnalysisDetail } from '../../../types/analysisReport'

const factIcons: Record<string, LucideIcon> = {
  sleep: Activity,
  hrv: Activity,
  weather: CloudSun,
  diet: Droplets,
  skin: ScanFace,
}

function formatWindowDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(date)
}

export function PatternAnalysisContent({ analysis }: { analysis: TriggerAnalysisDetail }) {
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-ez-primary">이 변화 전 72시간</p>
          <h2 className="mt-1 text-[18px] font-bold text-ez-text">함께 있었던 조건</h2>
        </div>
        <p className="shrink-0 text-[10px] text-ez-muted">
          {formatWindowDate(analysis.window.start)}–{formatWindowDate(analysis.window.end)}
        </p>
      </div>

      <section className="mt-3">
        {analysis.raw_facts.length > 0 ? (
          <Card className="overflow-hidden px-4">
            {analysis.raw_facts.map((fact, index) => {
              const Icon = factIcons[fact.type] ?? Activity
              return (
                <div key={`${fact.type}-${index}`} className="flex gap-3 py-4 [&+&]:border-t [&+&]:border-ez-border/80">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-[#e3fbf6] text-[#178873]">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <p className="pt-1 text-[12px] leading-5 text-ez-secondary">{fact.text}</p>
                </div>
              )
            })}
          </Card>
        ) : (
          <Card className="p-4">
            <p className="text-[13px] font-semibold text-ez-text">함께 볼 수 있는 기록이 아직 없어요.</p>
            <p className="mt-1 text-[11px] leading-5 text-ez-muted">이번 스캔은 저장됐어요. 다음 기록부터 차분히 살펴볼게요.</p>
          </Card>
        )}
      </section>

      <section className="mt-7">
        <SectionHeader title="관찰된 패턴" />
        <Card className="p-4">
          <p className="text-[13px] leading-6 text-ez-secondary">
            {analysis.observed_pattern?.text ?? '아직 반복해서 관찰된 패턴은 충분하지 않아요.'}
          </p>
          {analysis.observed_pattern?.sample_size !== undefined
            && analysis.observed_pattern.match_count !== undefined && (
            <p className="mt-2 text-[10px] text-ez-muted">
              {analysis.observed_pattern.sample_size}회 중 {analysis.observed_pattern.match_count}회 함께 관찰
            </p>
          )}
        </Card>
      </section>

      {analysis.common_knowledge?.sentence && (
        <section className="mt-7">
          <SectionHeader title="함께 참고한 정보" />
          <Card className="p-4"><p className="text-[12px] leading-5 text-ez-secondary">{analysis.common_knowledge.sentence}</p></Card>
        </section>
      )}

      <Link to="/briefing" className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[14px] bg-ez-primary-soft text-[13px] font-semibold text-ez-primary">
        오늘 루틴 보기 <ArrowRight size={15} aria-hidden="true" />
      </Link>
      <div className="mt-5"><Disclaimer>{analysis.disclaimer}</Disclaimer></div>
    </>
  )
}

export function PatternAnalysisInsufficient() {
  return (
    <Card className="p-4">
      <p className="text-[13px] font-semibold text-ez-text">함께 볼 수 있는 기록이 아직 없어요.</p>
      <p className="mt-1 text-[11px] leading-5 text-ez-muted">이번 스캔은 저장됐어요. 다음 기록부터 차분히 살펴볼게요.</p>
    </Card>
  )
}
