import { useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { ScanAction } from '../features/scan/components/ScanAction'
import { ScanFrame } from '../features/scan/components/ScanFrame'

export function ScanPage() {
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  return (
    <>
      <AppHeader title="피부 스캔" />
      <PageContainer className="pt-3">
        <header>
          <p className="text-[11px] font-semibold text-ez-primary">필요할 때만</p>
          <h1 className="mt-1.5 text-[21px] font-bold tracking-[-0.03em] text-ez-text">
            변화가 궁금할 때만 찍어요.
          </h1>
          <p className="mt-2 text-[13px] font-normal leading-5 text-ez-muted">
            매일 스캔하지 않아도 괜찮아요.
          </p>
        </header>

        <ScanFrame />
        <ScanAction
          isPlaceholderVisible={showPlaceholder}
          onStart={() => setShowPlaceholder(true)}
        />
      </PageContainer>
    </>
  )
}
