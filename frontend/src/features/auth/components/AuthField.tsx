import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../../utils/cn'

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string
  label: string
  error?: string
}

export function AuthField({ id, label, error, type = 'text', ...props }: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && isPasswordVisible ? 'text' : type
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-ez-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-[50px] w-full rounded-[14px] border bg-white px-4 text-[14px] font-normal text-ez-text outline-none transition placeholder:text-[#aaa4b1]',
            'border-ez-border focus:border-ez-primary focus:ring-3 focus:ring-ez-primary/10',
            isPassword && 'pr-12',
            error && 'border-ez-danger focus:border-ez-danger focus:ring-ez-danger/10',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-ez-muted transition hover:bg-ez-primary-soft hover:text-ez-primary"
            aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {isPasswordVisible
              ? <EyeOff size={18} strokeWidth={1.8} aria-hidden="true" />
              : <Eye size={18} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[12px] font-normal text-ez-danger">
          {error}
        </p>
      )}
    </div>
  )
}
