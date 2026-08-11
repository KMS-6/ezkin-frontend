import type { ReactNode } from 'react'
import { Construction, Sparkles } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { EmptyState } from '../components/ui/EmptyState'

interface PlaceholderPageProps {
  title: string
  description: string
  icon?: ReactNode
  backTo?: string
}

export function PlaceholderPage({ title, description, icon, backTo }: PlaceholderPageProps) {
  return (
    <>
      <AppHeader title={title} backTo={backTo} trailing={<Sparkles size={18} className="text-ez-primary" aria-hidden="true" />} />
      <PageContainer className="grid place-items-center py-10">
        <EmptyState icon={icon ?? <Construction size={22} />} title={`${title} 준비 중이에요`} description={description} />
      </PageContainer>
    </>
  )
}
