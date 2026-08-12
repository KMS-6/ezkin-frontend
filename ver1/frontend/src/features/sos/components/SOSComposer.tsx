import type { KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

export const SOS_MESSAGE_MAX_LENGTH = 300

interface SOSComposerProps {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  onSend: () => void
}

export function SOSComposer({ value, disabled = false, onChange, onSend }: SOSComposerProps) {
  const canSend = value.trim().length > 0 && !disabled

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    if (canSend) onSend()
  }

  return (
    <div className="flex items-end gap-2 rounded-[18px] border border-ez-border bg-white p-2 shadow-[0_6px_24px_rgba(46,34,77,0.07)]">
      <textarea
        rows={1}
        value={value}
        maxLength={SOS_MESSAGE_MAX_LENGTH}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="지금 궁금한 걸 짧게 물어보세요."
        aria-label="SOS 질문"
        className="min-h-11 max-h-28 flex-1 resize-none bg-transparent px-2 py-2.5 text-[13px] leading-5 text-ez-text outline-none placeholder:text-ez-muted/80 disabled:opacity-60"
      />
      <button
        type="button"
        disabled={!canSend}
        onClick={onSend}
        aria-label="메시지 보내기"
        className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-ez-primary text-white transition hover:bg-ez-primary-dark disabled:cursor-not-allowed disabled:bg-ez-border disabled:text-ez-muted"
      >
        <Send size={17} aria-hidden="true" />
      </button>
    </div>
  )
}
