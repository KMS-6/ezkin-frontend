import type { TroubleArea, TroubleEvent } from '../../../types/analysis'
import { Card } from '../../../components/ui/Card'

const areaLabels: Record<TroubleArea, string> = {
  forehead: '이마',
  leftCheek: '왼쪽 볼',
  rightCheek: '오른쪽 볼',
  chin: '턱',
}

const markerPositions: Record<TroubleArea, { x: number; y: number }> = {
  forehead: { x: 80, y: 43 },
  leftCheek: { x: 49, y: 94 },
  rightCheek: { x: 111, y: 94 },
  chin: { x: 80, y: 142 },
}

export function FaceMap({ events }: { events: TroubleEvent[] }) {
  const counts = events.reduce<Partial<Record<TroubleArea, number>>>((result, event) => {
    result[event.area] = (result[event.area] ?? 0) + 1
    return result
  }, {})
  const activeAreas = Object.entries(counts) as Array<[TroubleArea, number]>

  return (
    <Card className="flex items-center gap-4 p-4">
      <svg
        viewBox="0 0 160 180"
        className="h-[156px] w-[138px] shrink-0"
        role="img"
        aria-label="최근 피부 변화가 관찰된 얼굴 위치"
      >
        <path
          d="M80 16c-34 0-53 25-53 63 0 47 24 79 53 84 29-5 53-37 53-84 0-38-19-63-53-63Z"
          fill="#fbfaff"
          stroke="#dcd5ed"
          strokeWidth="2"
        />
        <path d="M54 77c7-5 15-5 22 0M84 77c7-5 15-5 22 0" fill="none" stroke="#cfc7de" strokeLinecap="round" strokeWidth="2" />
        <path d="M80 80v24l-6 5h12M66 125c9 6 19 6 28 0" fill="none" stroke="#d8d1e4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />

        {activeAreas.map(([area, count]) => {
          const position = markerPositions[area]
          return (
            <g key={area}>
              <circle cx={position.x} cy={position.y} r="13" fill="#eee9ff" stroke="#8a6de0" strokeWidth="1.5" />
              <text x={position.x} y={position.y + 4} textAnchor="middle" fill="#4b2e91" fontSize="11" fontWeight="700">
                {count}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-ez-muted">최근 변화 위치</p>
        <div className="mt-2.5 space-y-2.5">
          {activeAreas.map(([area, count]) => (
            <div key={area} className="flex items-center justify-between gap-2 border-b border-ez-border/70 pb-2.5 last:border-0 last:pb-0">
              <span className="flex items-center gap-2 text-[13px] font-medium text-ez-text">
                <span className="size-2 rounded-full bg-ez-primary" aria-hidden="true" />
                {areaLabels[area]}
              </span>
              <span className="text-[12px] font-semibold text-ez-primary-dark">{count}회</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-4 text-ez-muted">
          표시된 숫자는 최근 기록에서 관찰된 횟수예요.
        </p>
      </div>
    </Card>
  )
}
