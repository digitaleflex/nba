# Corrections Appliquées

> **Date:** June 28, 2026

---

## Corrections de Sécurité (Critiques)

### 1. EVIL-002 : XSS dans contenu signal ✅

**Fichier:** `next.config.ts`  
**Correction:** Ajout headers CSP, X-Frame-Options, X-Content-Type-Options

```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "Content-Security-Policy", value: "default-src 'self'; ..." },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ],
  }]
}
```

### 2. EVIL-013 : Publication sans ownership ✅

**Fichier:** `src/modules/signals/policies/signal-policy.ts`  
**Correction:** `canPublish()` prend maintenant le signal en paramètre

```ts
static async canPublish(userId: string, signal: { createdBy: string }): Promise<boolean>
```

**Fichier:** `src/modules/signals/services/publish-signal.ts`  
**Correction:** Ownership check ajouté

```ts
const allowed = await SignalPolicy.canPublish(userId, signal)
```

### 3. EVIL-018 : Mass access requests ✅

**Fichier:** `src/app/api/public/select-plan/route.ts`  
**Correction:** Duplicate request check + rate limiting Better Auth

```ts
const existingRequest = await prisma.accessRequest.findFirst({
  where: { userId: session.user.id, planId: parsed.planId, status: "PENDING" },
})
```

### 4. EVIL-020 : Audit log non protégé ✅

**Fichier:** `src/app/api/admin/audit-logs/route.ts`  
**Correction:** Déjà protégé par `requireRole(["ADMIN", "SUPER_ADMIN"])`

---

## Améliorations Supplémentaires

### XSS Protection

**Fichier:** `src/modules/signals/validators/signal-schema.ts`  
**Correction:** URL validation ajoutée

```ts
imageUrls: z.array(z.string().url("URL d'image invalide")).max(5)
```

---

## Tests Recommandés

Avant merge :

```bash
npm run typecheck  # Vérifier TypeScript
npm run lint       # Vérifier ESLint
npm run test       # Exécuter tests unitaires
```

---

## Checklist QA

- [x] EVIL-002 : CSP headers ajoutés
- [x] EVIL-013 : Ownership check dans publish/duplicate
- [x] EVIL-018 : Protection against mass requests
- [x] EVIL-020 : Endpoint audit déjà protégé
- [ ] SEC-AUTH-007 : MFA pour admins (optionnel V1)