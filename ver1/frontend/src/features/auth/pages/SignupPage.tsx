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

export function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
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
      await signup({ email, password })
      navigate('/onboarding', { replace: true })
    } catch (error) {
      if (error instanceof AuthServiceError && error.code === 'EMAIL_IN_USE') {
        setErrors({ email: error.message })
      } else {
        setErrors({ form: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageLayout
      title="EZkin을 시작해볼까요?"
      description="계정을 만들면 바로 온보딩을 시작해요."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <AuthField
            id="signup-email"
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
            id="signup-password"
            label="비밀번호"
            type="password"
            autoComplete="new-password"
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
          {isSubmitting ? '계정 만드는 중' : '계정 만들기'}
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-[13px] text-ez-muted">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="font-semibold text-ez-primary hover:text-ez-primary-dark">
          로그인
        </Link>
      </p>
    </AuthPageLayout>
  )
}
