import { MessageCircleQuestion } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { StickyDetailHeader } from '../components/StickyDetailHeader'
import { EmptyState } from '../components/ui/EmptyState'

export function SosPage() {
  return (
    <>
      <StickyDetailHeader title="SOS 케어" backTo="/home" />
      <PageContainer className="grid place-items-center py-10">
        <EmptyState
          icon={<MessageCircleQuestion size={23} aria-hidden="true" />}
          title="갑자기 피부가 신경 쓰일 때"
          description={'빠르게 물어볼 수 있는 기능이에요.\n\nAI 케어 연결을 준비하고 있어요.'}
        />
      </PageContainer>
    </>
  )
}
