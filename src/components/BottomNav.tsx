import { Activity, ChartNoAxesCombined, House, ScanFace, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'

const tabs = [
  { label: '홈', to: '/home', icon: House },
  { label: '라이프로그', to: '/lifelog', icon: Activity },
  { label: '스캔', to: '/scan', icon: ScanFace, featured: true },
  { label: '내 화장대', to: '/shelf', icon: Sparkles },
  { label: '분석', to: '/analysis', icon: ChartNoAxesCombined },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-ez-border/80 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:bottom-4 sm:rounded-b-[28px] sm:border-x" aria-label="주요 메뉴">
      <div className="grid grid-cols-5">
        {tabs.map(({ label, to, icon: Icon, featured }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex min-w-0 flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-medium text-ez-muted transition-colors',
                isActive && 'font-bold text-ez-primary',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-xl transition-all',
                    featured && 'bg-ez-primary-soft',
                    isActive && 'bg-ez-primary-soft',
                  )}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
                </span>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
