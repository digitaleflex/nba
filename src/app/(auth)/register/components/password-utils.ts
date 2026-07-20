export const MIN_PASSWORD_LENGTH = 10

export interface PasswordStrength {
  score: number
  label: string
  color: string
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score++
  if (password.length >= 14) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: "Faible", color: "bg-destructive" }
  if (score <= 3) return { score, label: "Moyen", color: "bg-warning" }
  if (score <= 4) return { score, label: "Bon", color: "bg-primary" }
  return { score, label: "Très bon", color: "bg-success" }
}

export const RULES = [
  { test: (p: string) => p.length >= MIN_PASSWORD_LENGTH, label: `Au moins ${MIN_PASSWORD_LENGTH} caractères` },
  { test: (p: string) => /[A-Z]/.test(p), label: "Une lettre majuscule" },
  { test: (p: string) => /[a-z]/.test(p), label: "Une lettre minuscule" },
  { test: (p: string) => /[0-9]/.test(p), label: "Un chiffre" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Un caractère spécial" },
]

export function isPasswordValid(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && RULES.every((rule) => rule.test(password))
}
