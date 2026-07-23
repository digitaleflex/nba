export const MIN_PASSWORD_LENGTH = 10

export interface PasswordStrength {
  score: number
  label: string
  color: string
  feedback: string
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score++
  if (password.length >= 14) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const missing: string[] = []
  if (password.length > 0) {
    if (password.length < MIN_PASSWORD_LENGTH) missing.push(`au moins ${MIN_PASSWORD_LENGTH} caractères`)
    if (!/[A-Z]/.test(password)) missing.push("une majuscule")
    if (!/[a-z]/.test(password)) missing.push("une minuscule")
    if (!/[0-9]/.test(password)) missing.push("un chiffre")
    if (!/[^A-Za-z0-9]/.test(password)) missing.push("un caractère spécial")
  }

  let prefix: string
  let feedback: string

  if (score <= 2) {
    prefix = "Mot de passe faible"
  } else if (score <= 3) {
    prefix = "Mot de passe moyen"
  } else if (score <= 4) {
    prefix = "Mot de passe bon"
  } else {
    prefix = "Mot de passe très bon"
  }

  if (score >= 5) {
    feedback = `${prefix} !`
  } else if (missing.length > 0) {
    feedback = `${prefix} — ajoutez ${missing.join(", ")}`
  } else {
    feedback = prefix
  }

  if (score <= 2) return { score, label: "Faible", color: "bg-destructive", feedback }
  if (score <= 3) return { score, label: "Moyen", color: "bg-warning", feedback }
  if (score <= 4) return { score, label: "Bon", color: "bg-primary", feedback }
  return { score, label: "Très bon", color: "bg-success", feedback }
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
