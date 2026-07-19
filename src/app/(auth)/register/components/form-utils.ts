export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// WhatsApp : accepte + optionnel, chiffres, espaces, tirets, parenthèses.
// Minimum 8 chiffres significatifs.
export function isValidWhatsapp(raw: string): boolean {
  const digits = raw.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
}
