import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PrimaryButton } from '../../../components/ui/Button'
import { AuthServiceError } from '../../../services/authService'
import { useAuth } from '../authContextValue'
import { validateEmail, validatePassword } from '../validation'
import { AuthField } from '../components/AuthField'
import { AuthPageLayout } from '../components/AuthPageLayout'

interface FormErrors {
  email?: string
  password?: string
  form?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(user.onboardingCompleted ? '/home' : '/onboarding', { replace: true })
    } catch (error) {
      if (error instanceof AuthServiceError && error.code === 'INVALID_CREDENTIALS') {
        setErrors({ password: error.message })
      } else {
        setErrors({ form: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageLayout
      title="다시 만나서 반가워요."
      description="오늘 필요한 케어를 확인해보세요."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <AuthField
            id="login-email"
            label="이메일"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            error={errors.email}
            onChange={(event) => {
              setEmail(event.target.value)
              setErrors((current) => ({ ...current, email: undefined, form: undefined }))
            }}
          />
          <AuthField
            id="login-password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="8자 이상 입력해주세요"
            value={password}
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors((current) => ({ ...current, password: undefined, form: undefined }))
            }}
          />
        </div>

        {errors.form && <p className="mt-3 text-[12px] text-ez-danger" role="alert">{errors.form}</p>}

        <PrimaryButton
          type="submit"
          fullWidth
          className="mt-6"
          disabled={isSubmitting}
          icon={isSubmitting
            ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
            : <ArrowRight size={17} aria-hidden="true" />}
        >
          {isSubmitting ? '로그인 중' : '로그인'}
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-[13px] text-ez-muted">
        아직 계정이 없나요?{' '}
        <Link to="/signup" className="font-semibold text-ez-primary hover:text-ez-primary-dark">
          회원가입
        </Link>
      </p>

      <div className="mt-8 border-t border-ez-border pt-5 text-center">
        <button type="button" disabled className="text-[12px] text-ez-muted disabled:cursor-default" title="비밀번호 찾기는 준비 중이에요">
          비밀번호를 잊으셨나요? <span className="text-[#aaa4b1]">준비 중</span>
        </button>
      </div>
    </AuthPageLayout>
  )
}
