const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return '이메일을 입력해주세요.'
  if (!EMAIL_PATTERN.test(email.trim())) return '이메일 형식을 확인해주세요.'
  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) return '비밀번호를 입력해주세요.'
  if (password.length < 8) return '비밀번호는 8자 이상 입력해주세요.'
  return undefined
}
