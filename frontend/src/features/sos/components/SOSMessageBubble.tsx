import { Sparkles } from 'lucide-react'
import type { SOSMessage } from '../../../types/sos'

export function SOSMessageBubble({ message }: { message: SOSMessage }) {
  const isUser = message.role === 'user'

  return (
    <article className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="mb-1 grid size-7 shrink-0 place-items-center rounded-full bg-[#fff1f7] text-[#ec4899]" aria-hidden="true">
          <Sparkles size={13} />
        </span>
      )}
      <p
        className={`max-w-[82%] whitespace-pre-wrap rounded-[16px] px-3.5 py-3 text-[13px] leading-[1.65] shadow-card ${
          isUser
            ? 'rounded-br-[5px] bg-ez-primary-soft text-ez-primary-dark'
            : 'rounded-bl-[5px] border border-ez-border bg-white text-ez-text'
        }`}
      >
        {message.content}
      </p>
    </article>
  )
}
