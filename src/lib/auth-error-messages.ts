// Mapping des erreurs d'authentification vers des messages utilisateur sûrs.
// Évite de fuiter les messages internes du serveur (Better Auth, Prisma, etc.)
// vers l'utilisateur final.

const GENERIC_AUTH_ERROR = "Une erreur est survenue. Veuillez réessayer."

// Messages connus de Better Auth et leurs équivalents français sécurisés.
const KNOWN_ERRORS: Record<string, string> = {
  "invalid email or password": "Email ou mot de passe incorrect.",
  "invalid credentials": "Email ou mot de passe incorrect.",
  "email or password incorrect": "Email ou mot de passe incorrect.",
  "account not found": "Aucun compte trouvé avec cet email.",
  "user not found": "Aucun compte trouvé avec cet email.",
  "email already exists": "Un compte existe déjà avec cet email.",
  "email is already in use": "Un compte existe déjà avec cet email.",
  "invalid token": "Ce lien est invalide ou a expiré.",
  "invalid reset token": "Ce lien de réinitialisation est invalide ou a expiré.",
  "token expired": "Ce lien a expiré. Veuillez en demander un nouveau.",
  "too many attempts": "Trop de tentatives. Veuillez patienter quelques minutes.",
  "rate limit exceeded": "Trop de tentatives. Veuillez patienter quelques minutes.",
  "email not verified": "Veuillez vérifier votre email avant de vous connecter.",
  "user is banned": "Ce compte a été suspendu. Contactez le support.",
  "user is disabled": "Ce compte a été désactivé. Contactez le support.",
  "password too short": "Le mot de passe est trop court.",
  "password too weak": "Le mot de passe est trop faible.",
}

export function safeAuthErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    const lower = error.toLowerCase()
    for (const [key, value] of Object.entries(KNOWN_ERRORS)) {
      if (lower.includes(key)) return value
    }
    return GENERIC_AUTH_ERROR
  }

  if (error && typeof error === "object") {
    const err = error as { message?: string; statusText?: string }
    const raw = err.message ?? err.statusText
    if (raw) {
      const lower = raw.toLowerCase()
      for (const [key, value] of Object.entries(KNOWN_ERRORS)) {
        if (lower.includes(key)) return value
      }
    }
  }

  return GENERIC_AUTH_ERROR
}

export { GENERIC_AUTH_ERROR }
