import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { StickyDetailHeader } from '../components/StickyDetailHeader'
import { SOSComposer } from '../features/sos/components/SOSComposer'
import { SOSMessageBubble } from '../features/sos/components/SOSMessageBubble'
import { SOSQuickQuestions } from '../features/sos/components/SOSQuickQuestions'
import { SOSTypingIndicator } from '../features/sos/components/SOSTypingIndicator'
import { useAuth } from '../features/auth/authContextValue'
import { getSOSContext } from '../services/sosContextService'
import { SOSServiceError, sendSOSMessage } from '../services/sosService'
import type { SOSContext, SOSMessage } from '../types/sos'

interface FailedSOSRequest {
  message: string
  errorMessage: string
}

function createMessage(role: SOSMessage['role'], content: string): SOSMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}

export function SosPage() {
  const { user } = useAuth()
  const [context, setContext] = useState<SOSContext | null>(null)
  const [messages, setMessages] = useState<SOSMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [failedRequest, setFailedRequest] = useState<FailedSOSRequest | null>(null)
  const requestInFlightRef = useRef(false)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    let active = true

    void getSOSContext(user.id)
      .then((nextContext) => {
        if (active) setContext(nextContext)
      })
      .catch(() => {
        if (active) setContext({ userId: user.id })
      })

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [failedRequest, isSending, messages])

  const requestAnswer = useCallback(async (message: string, appendUserMessage: boolean) => {
    const trimmedMessage = message.trim()
    if (!user || !trimmedMessage || requestInFlightRef.current) return false

    requestInFlightRef.current = true
    setFailedRequest(null)
    setIsSending(true)
    if (appendUserMessage) {
      setMessages((current) => [...current, createMessage('user', trimmedMessage)])
    }

    try {
      const requestContext = context ?? await getSOSContext(user.id).catch(() => ({ userId: user.id }))
      setContext(requestContext)
      const response = await sendSOSMessage({
        message: trimmedMessage,
        context: requestContext,
      })
      setMessages((current) => [...current, createMessage('assistant', response.message)])
      return true
    } catch (error) {
      setFailedRequest({
        message: trimmedMessage,
        errorMessage: error instanceof SOSServiceError && error.code === 'SAFETY_CHECK_FAILED'
          ? '지금은 답변을 준비하지 못했어요.\n잠시 후 다시 시도해 주세요.'
          : '답변을 불러오지 못했어요.',
      })
      return false
    } finally {
      requestInFlightRef.current = false
      setIsSending(false)
    }
  }, [context, user])

  const sendDraft = () => {
    const message = draft.trim()
    if (!message || requestInFlightRef.current) return
    setDraft('')
    void requestAnswer(message, true)
  }

  const selectQuickQuestion = (question: string) => {
    void requestAnswer(question, true)
  }

  const retry = () => {
    if (failedRequest) void requestAnswer(failedRequest.message, false)
  }

  return (
    <>
      <StickyDetailHeader title="SOS 케어" backTo="/home" />
      <PageContainer className="flex min-h-[calc(100dvh-56px)] flex-col pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:min-h-[calc(100vh-88px)]">
        <header>
          <p className="text-[14px] font-medium text-ez-secondary">
            갑자기 피부가 신경 쓰일 때 바로 물어보세요.
          </p>
        </header>

        <div className="flex-1 pt-5">
          {messages.length === 0 && !isSending && !failedRequest && (
            <SOSQuickQuestions disabled={isSending} onSelect={selectQuickQuestion} />
          )}

          <div className="space-y-3" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <SOSMessageBubble key={message.id} message={message} />
            ))}
            {isSending && <SOSTypingIndicator />}
            {failedRequest && !isSending && (
              <div className="flex items-end gap-2" role="alert">
                <div className="max-w-[82%] rounded-[16px] rounded-bl-[5px] border border-ez-border bg-white px-3.5 py-3 shadow-card">
                  <p className="whitespace-pre-line text-[13px] leading-5 text-ez-text">{failedRequest.errorMessage}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-ez-primary hover:text-ez-primary-dark"
                  >
                    <RefreshCw size={13} aria-hidden="true" /> 다시 시도
                  </button>
                </div>
              </div>
            )}
            <div ref={conversationEndRef} />
          </div>
        </div>

        <footer className="sticky bottom-0 z-20 -mx-1 mt-5 bg-ez-bg/95 px-1 pt-3 backdrop-blur-md">
          <SOSComposer
            value={draft}
            disabled={isSending}
            onChange={setDraft}
            onSend={sendDraft}
          />
          <p className="px-2 pt-2 text-center text-[10px] leading-4 text-ez-muted">
            EZkin의 답변은 웰니스 가이드이며 의료 진단을 대신하지 않아요.
          </p>
        </footer>
      </PageContainer>
    </>
  )
}
