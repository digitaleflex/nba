// Messages d'erreur d'authentification, traduits et reformulés
// pour être clairs, sans jargon technique, et orientés action.
//
// Principe : chaque message dit ce qui se passe, pourquoi, et quoi faire.

export const AUTH_MESSAGES = {
  // ── Connexion ──
  WRONG_CREDENTIALS:
    "Email ou mot de passe incorrect. Vérifiez votre saisie et réessayez.",
  ACCOUNT_NOT_FOUND:
    "Aucun compte n'existe avec cet email. Vous pouvez en créer un gratuitement.",
  EMAIL_NOT_VERIFIED:
    "Votre email n'est pas encore vérifié. Cliquez sur le lien que nous vous avons envoyé par email (vérifiez aussi vos spams).",
  TWO_FACTOR_REQUIRED:
    "Un code de vérification est nécessaire. Saisissez le code reçu par email.",
  TOO_MANY_LOGIN_ATTEMPTS:
    "Trop de tentatives de connexion. Réessayez dans 1 minute.",
  ACCOUNT_SUSPENDED:
    "Votre compte est suspendu. Contactez-nous via le formulaire de support pour connaître la raison.",
  ACCOUNT_DISABLED:
    "Votre compte est désactivé. Contactez-nous pour le réactiver.",
  LOGIN_BLOCKED_SECURITY:
    "Connexion bloquée pour sécurité. Si vous pensez que c'est une erreur, contactez le support.",
  NETWORK_ERROR:
    "Problème de connexion internet. Vérifiez votre réseau et réessayez.",

  // ── Inscription ──
  EMAIL_ALREADY_EXISTS:
    "Un compte existe déjà avec cet email. Connectez-vous ou utilisez 'Mot de passe oublié' si vous ne vous en souvenez plus.",
  PASSWORD_TOO_SHORT:
    "Le mot de passe est trop court. Il faut au moins 10 caractères.",
  PASSWORD_TOO_WEAK:
    "Le mot de passe est trop simple. Ajoutez des majuscules, des chiffres ou des caractères spéciaux.",
  INVALID_EMAIL_FORMAT:
    "Format d'email invalide. Exemple : votre.nom@email.com",
  SIGNUP_RATE_LIMIT:
    "Trop d'inscriptions depuis cette connexion. Réessayez dans une heure.",
  ACCOUNT_BANNED: (reason: string) =>
    `Inscription impossible : ${reason}. Contactez le support pour plus d'informations.`,

  // ── Mot de passe oublié / Réinitialisation ──
  RESET_TOKEN_EXPIRED:
    "Ce lien a expiré. Redemandez un nouveau lien depuis la page 'Mot de passe oublié'.",
  RESET_TOKEN_INVALID:
    "Ce lien n'est pas valide. Redemandez-en un nouveau.",
  PASSWORD_MISMATCH:
    "Les deux mots de passe ne sont pas identiques. Saisissez le même mot de passe dans les deux champs.",
  PASSWORD_MIN_LENGTH:
    "Le mot de passe doit contenir au moins 10 caractères.",
  RESET_EMAIL_SENT:
    "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",

  // ── Limite de tentatives (général) ──
  RATE_LIMIT_GENERIC:
    "Trop de demandes. Patientez quelques instants avant de réessayer.",

  // ── Erreurs techniques (affichées quand on ne peut pas être précis) ──
  GENERIC_ERROR:
    "Une erreur est survenue. Réessayez dans un instant. Si le problème persiste, contactez le support.",
  MAINTENANCE:
    "Le service est temporairement en maintenance. Réessayez dans quelques minutes.",

  // ── Validation champs ──
  EMAIL_REQUIRED: "Saisissez votre adresse email.",
  PASSWORD_REQUIRED: "Saisissez votre mot de passe.",
  NAME_REQUIRED:
    "Saisissez votre prénom et votre nom (2 caractères minimum chacun).",
  CODE_REQUIRED: "Saisissez le code de vérification.",
  CODE_6_DIGITS: "Le code doit contenir 6 chiffres.",
  CODE_INVALID: "Ce code est incorrect ou a expiré. Redemandez-en un nouveau.",
  ACCOUNT_DELETED_COOLDOWN: "Vous avez supprimé votre compte récemment. Réessayez dans quelques jours.",
} as const

// ── Mapping rétrocompatible pour safeAuthErrorMessage ──
const KNOWN_PATTERNS: [string, string][] = [
  // Better Auth patterns → message clair
  ["invalid email or password", AUTH_MESSAGES.WRONG_CREDENTIALS],
  ["invalid credentials", AUTH_MESSAGES.WRONG_CREDENTIALS],
  ["email or password incorrect", AUTH_MESSAGES.WRONG_CREDENTIALS],
  ["account not found", AUTH_MESSAGES.ACCOUNT_NOT_FOUND],
  ["user not found", AUTH_MESSAGES.ACCOUNT_NOT_FOUND],
  ["email not verified", AUTH_MESSAGES.EMAIL_NOT_VERIFIED],
  ["email already exists", AUTH_MESSAGES.EMAIL_ALREADY_EXISTS],
  ["email is already in use", AUTH_MESSAGES.EMAIL_ALREADY_EXISTS],
  ["invalid token", AUTH_MESSAGES.RESET_TOKEN_INVALID],
  ["invalid reset token", AUTH_MESSAGES.RESET_TOKEN_INVALID],
  ["token expired", AUTH_MESSAGES.RESET_TOKEN_EXPIRED],
  ["too many attempts", AUTH_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS],
  ["rate limit exceeded", AUTH_MESSAGES.RATE_LIMIT_GENERIC],
  ["password too short", AUTH_MESSAGES.PASSWORD_TOO_SHORT],
  ["password too weak", AUTH_MESSAGES.PASSWORD_TOO_WEAK],
  ["user is banned", AUTH_MESSAGES.ACCOUNT_SUSPENDED],
  ["user is disabled", AUTH_MESSAGES.ACCOUNT_DISABLED],
  // Patterns spécifiques français (venant de better-auth)
  ["banni", AUTH_MESSAGES.ACCOUNT_BANNED("").replace(" : .", "")],
  ["suspendu", AUTH_MESSAGES.ACCOUNT_SUSPENDED],
  ["désactivé", AUTH_MESSAGES.ACCOUNT_DISABLED],
  ["déjà utilisé", AUTH_MESSAGES.EMAIL_ALREADY_EXISTS],
  ["already exists", AUTH_MESSAGES.EMAIL_ALREADY_EXISTS],
  // Cooldown 72h après suppression de compte
  ["supprimé votre compte il y a moins de 72h", AUTH_MESSAGES.ACCOUNT_DELETED_COOLDOWN],
]

const GENERIC = AUTH_MESSAGES.GENERIC_ERROR

export function safeAuthErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    const lower = error.toLowerCase()
    for (const [key, value] of KNOWN_PATTERNS) {
      if (lower.includes(key)) return value
    }
    return GENERIC
  }

  if (error && typeof error === "object") {
    const err = error as { message?: string; statusText?: string }
    const raw = err.message ?? err.statusText
    if (raw) {
      const lower = raw.toLowerCase()
      for (const [key, value] of KNOWN_PATTERNS) {
        if (lower.includes(key)) return value
      }
    }
  }

  return GENERIC
}

export { GENERIC }
