import { createHmac, timingSafeEqual } from "crypto"

/**
 * Vérifie la signature d'un cookie Better Auth.
 * Le format est: urlEncode(`${value}.${base64(HMAC-SHA256(secret, value))}`)
 * On extrait le token de session après vérification.
 */
export async function verifySignedCookie(
  cookieValue: string,
  secret: string
): Promise<string | null> {
  try {
    const decoded = decodeURIComponent(cookieValue)
    // Le dernier `.` sépare la signature
    const lastDot = decoded.lastIndexOf(".")
    if (lastDot === -1) return null

    const value = decoded.slice(0, lastDot)
    const b64Signature = decoded.slice(lastDot + 1)

    // Décoder la signature base64
    const signature = Buffer.from(b64Signature, "base64")

    // Calculer la signature attendue
    const expected = createHmac("sha256", secret).update(value).digest()

    // Comparaison en temps constant
    if (signature.length !== expected.length) return null
    if (!timingSafeEqual(signature, expected)) return null

    return value
  } catch {
    return null
  }
}

/**
 * Extrait le token de session depuis le header Cookie.
 * Supporte les préfixes __Secure- et __Host-.
 */
export function extractSessionToken(
  cookieHeader: string | undefined,
  cookieName: string
): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";").map((c) => c.trim())
  const fullName = cookieName
  const secureName = `__Secure-${cookieName}`
  const hostName = `__Host-${cookieName}`

  for (const cookie of cookies) {
    const eq = cookie.indexOf("=")
    if (eq === -1) continue
    const name = cookie.slice(0, eq)
    if (name === fullName || name === secureName || name === hostName) {
      return cookie.slice(eq + 1)
    }
  }
  return null
}
