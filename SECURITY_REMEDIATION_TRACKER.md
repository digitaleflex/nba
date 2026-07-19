# SECURITY REMEDIATION TRACKER — NeverBrokeAgain (NBA)

> **Référence :** [MASTER_SECURITY_AUDIT.md](./MASTER_SECURITY_AUDIT.md) · Score actuel : **56/100**
> **Objectif :** 100/100
> **Trajectoire :** 56 🔴→ 76 🟠→ 91 🟡→ 100

---

## 🔴 PHASE 1 — Quick Wins (56 → 76/100)
**Milestone :** [#26](https://github.com/digitaleflex/nba/milestone/26) · **Deadline :** 2026-07-21 · **Effort :** ~1 jour

| # | Issue | Action | Statut | Date |
|---|---|---|---|---|---|
| Q1 | [#91](https://github.com/digitaleflex/nba/issues/91) | `select` sans `token` sur sessions admin | ✅ | 2026-07-19 |
| Q2 | [#92](https://github.com/digitaleflex/nba/issues/92) | `new URL(origin).origin === o` dans csrf.ts | ✅ | 2026-07-19 |
| Q3 | [#93](https://github.com/digitaleflex/nba/issues/93) | `/api/webhooks` + `/api/telegram` dans PUBLIC_PREFIXES | ✅ | 2026-07-19 |
| Q4 | [#94](https://github.com/digitaleflex/nba/issues/94) | `X-Telegram-Bot-Api-Secret-Token` webhook Telegram | ✅ | 2026-07-19 |
| Q5 | [#95](https://github.com/digitaleflex/nba/issues/95) | Supprimer `PGPASSWORD` test-suite.sh + rotation | ✅ | 2026-07-19 |
| Q6 | [#96](https://github.com/digitaleflex/nba/issues/96) | `isActive` dans `requirePermission` | ✅ | 2026-07-19 |
| Q7 | [#97](https://github.com/digitaleflex/nba/issues/97) | Headers sécurité (HSTS, XFO, XCTO, RP, PP) | ✅ | 2026-07-19 |
| Q8 | [#98](https://github.com/digitaleflex/nba/issues/98) | `expose` au lieu de `ports` Redis dans compose | ✅ | 2026-07-19 |

**Checkpoint :** 76/100 = GO avec réserves

---

## 🟠 PHASE 2 — Court terme (76 → 91/100)
**Milestone :** [#27](https://github.com/digitaleflex/nba/milestone/27) · **Deadline :** 2026-07-28 · **Effort :** ~1 semaine

| # | Issue | Action | Statut | Date |
|---|---|---|---|---|
| S1 | [#99](https://github.com/digitaleflex/nba/issues/99) | `session.deleteMany()` après changePassword | ⬜ | - |
| S2 | [#100](https://github.com/digitaleflex/nba/issues/100) | Uniformiser check-login + rate-limit | ⬜ | - |
| S3 | [#101](https://github.com/digitaleflex/nba/issues/101) | Header trust conditionnel (CF-Ray) | ⬜ | - |
| S4 | [#102](https://github.com/digitaleflex/nba/issues/102) | `USER nextjs` + `cap_drop:[ALL]` Docker | ⬜ | - |
| S5 | [#103](https://github.com/digitaleflex/nba/issues/103) | Exclure `.env` backup + chiffrer dump | ⬜ | - |
| S6 | [#104](https://github.com/digitaleflex/nba/issues/104) | `beforeSend` PII scrubbing Sentry | ⬜ | - |
| S7 | [#105](https://github.com/digitaleflex/nba/issues/105) | `rateLimitMiddleware` sur sign-in | ⬜ | - |
| S8 | [#106](https://github.com/digitaleflex/nba/issues/106) | `productionSourceMaps: false` | ⬜ | - |

**Checkpoint :** 91/100 = GO production

---

## 🟡 PHASE 3 — Moyen terme (91 → 100/100)
**Milestone :** [#28](https://github.com/digitaleflex/nba/milestone/28) · **Deadline :** 2026-08-31 · **Effort :** ~1 mois

| # | Issue | Action | Statut | Date |
|---|---|---|---|---|
| M1 | [#107](https://github.com/digitaleflex/nba/issues/107) | CSP (Content-Security-Policy) | ⬜ | - |
| M2 | [#108](https://github.com/digitaleflex/nba/issues/108) | `hardDeleteUser` self-service GDPR | ⬜ | - |
| M3 | [#109](https://github.com/digitaleflex/nba/issues/109) | Zod sur tous les PUT/PATCH | ⬜ | - |
| M4 | [#110](https://github.com/digitaleflex/nba/issues/110) | Cleanup auto audit-logs + KYC rows | ⬜ | - |
| M5 | [#111](https://github.com/digitaleflex/nba/issues/111) | Rôles DB séparés (read-only app) | ⬜ | - |
| M6 | [#112](https://github.com/digitaleflex/nba/issues/112) | Scan antivirus uploads (ClamAV) | ⬜ | - |
| M7 | [#113](https://github.com/digitaleflex/nba/issues/113) | Monitoring sécurité (Sentry alerts, fail2ban) | ⬜ | - |

**Checkpoint :** 100/100 = Conforme

---

## LÉGENDE

| Icône | Signification |
|---|---|
| ⬜ | À faire |
| 🔄 | En cours |
| ✅ | Terminé |
| ❌ | Bloqué |
| ⏭️ | Reporté |

---

## PROGRESSION GLOBALE

```
Score : 76/100 (+20)
Phase 1 : 8/8  ██████████████████████  100% ✅
Phase 2 : 0/8  ░░░░░░░░░░░░░░░░░░░░░  0%
Phase 3 : 0/7  ░░░░░░░░░░░░░░░░░░░░░  0%
────
Total   : 8/23 █████████░░░░░░░░░░░░  35%
```

---

## LOG D'INTERVENTION

| Date | Qui | #Issue | Action |
|---|---|---|---|
| 2026-07-19 | Audit | - | Création du plan suite au MASTER_SECURITY_AUDIT |
| 2026-07-19 | opencode | Q1-Q8 | Phase 1 terminée — 8/8 Quick Wins — score 56 → 76 |

---

*Fichier de suivi local — synchronisé avec les milestones et issues GitHub.*
*Mettre à jour les statuts après chaque session.*
