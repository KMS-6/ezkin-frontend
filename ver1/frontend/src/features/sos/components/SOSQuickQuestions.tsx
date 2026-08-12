import { ArrowUpRight } from 'lucide-react'

const quickQuestions = [
  '매운 거 먹었는데 괜찮을까?',
  '오늘 레티놀 써도 될까?',
  '갑자기 너무 건조해',
  '턱에 뭐가 올라올 것 같아',
]

interface SOSQuickQuestionsProps {
  disabled?: boolean
  onSelect: (question: string) => void
}

export function SOSQuickQuestions({ disabled = false, onSelect }: SOSQuickQuestionsProps) {
  return (
    <section aria-labelledby="sos-quick-question-title">
      <h2 id="sos-quick-question-title" className="text-[15px] font-semibold tracking-[-0.02em] text-ez-text">
        지금 뭐가 신경 쓰이나요?
      </h2>
      <div className="mt-3 grid gap-2">
        {quickQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            className="flex min-h-12 items-center justify-between gap-3 rounded-[14px] border border-ez-border bg-white px-4 py-3 text-left text-[13px] font-medium text-ez-text shadow-card transition hover:border-ez-primary/25 hover:bg-ez-primary-soft/35 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span>{question}</span>
            <ArrowUpRight size={15} className="shrink-0 text-ez-primary" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  )
}
