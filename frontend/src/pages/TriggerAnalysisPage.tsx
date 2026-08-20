import { useCallback, useEffect, useState } from 'react'
import { ScanFace } from 'lucide-react'
import { useLocation, useParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { StickyDetailHeader } from '../components/StickyDetailHeader'
import { EmptyState } from '../components/ui/EmptyState'
import {
  PatternAnalysisContent,
  PatternAnalysisInsufficient,
} from '../features/analysis/components/PatternAnalysisContent'
import { useAuth } from '../features/auth/authContextValue'
import { getPatternAnalysis } from '../services/analysisService'
import type { TriggerAnalysisDetail } from '../types/analysisReport'

export function TriggerAnalysisPage() {
  const { user } = useAuth()
  const { scanId = '' } = useParams()
  const location = useLocation()
  const [analysis, setAnalysis] = useState<TriggerAnalysisDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadAnalysis = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setHasError(false)
    try {
      setAnalysis(await getPatternAnalysis(user.id, scanId))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [scanId, user])

  useEffect(() => { void loadAnalysis() }, [loadAnalysis])
  if (!user) return null

  return (
    <>
      <StickyDetailHeader
        title="72시간 흐름"
        backTo={(location.state as { backTo?: string } | null)?.backTo === '/analysis' ? '/analysis' : '/scan'}
      />
      <PageContainer className="pt-3">
        {isLoading ? <TriggerSkeleton /> : hasError ? (
          <EmptyState icon={<ScanFace size={22} />} title="분석 흐름을 불러오지 못했어요" description="분석 화면에서 다시 열어주세요." />
        ) : analysis ? <PatternAnalysisContent analysis={analysis} /> : <PatternAnalysisInsufficient />}
      </PageContainer>
    </>
  )
}

function TriggerSkeleton() {
  return <div className="animate-pulse" aria-label="72시간 흐름 불러오는 중"><div className="h-40 rounded-[22px] bg-[#eee9f8]" /><div className="mt-7 h-80 rounded-[20px] bg-[#efecf4]" /></div>
}
