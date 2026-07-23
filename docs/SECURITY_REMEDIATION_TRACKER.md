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
|---|---|---|---|---|---|
| S1 | [#99](https://github.com/digitaleflex/nba/issues/99) | `session.deleteMany()` après changePassword | ✅ | 2026-07-19 |
| S2 | [#100](https://github.com/digitaleflex/nba/issues/100) | Uniformiser check-login + rate-limit | ✅ | 2026-07-19 |
| S3 | [#101](https://github.com/digitaleflex/nba/issues/101) | Header trust conditionnel (CF-Ray) | ✅ | 2026-07-19 |
| S4 | [#102](https://github.com/digitaleflex/nba/issues/102) | `USER nextjs` + `cap_drop:[ALL]` Docker | ✅ | 2026-07-19 |
| S5 | [#103](https://github.com/digitaleflex/nba/issues/103) | Exclure `.env` backup + chiffrer dump | ✅ | 2026-07-19 |
| S6 | [#104](https://github.com/digitaleflex/nba/issues/104) | `beforeSend` PII scrubbing Sentry | ✅ | 2026-07-19 |
| S7 | [#105](https://github.com/digitaleflex/nba/issues/105) | `rateLimitMiddleware` sur sign-in | ✅ | 2026-07-19 |
| S8 | [#106](https://github.com/digitaleflex/nba/issues/106) | `productionSourceMaps: false` | ✅ | 2026-07-19 |

**Checkpoint :** 91/100 = GO production

---

## 🟡 PHASE 3 — Moyen terme (91 → 100/100)
**Milestone :** [#28](https://github.com/digitaleflex/nba/milestone/28) · **Deadline :** 2026-08-31 · **Effort :** ~1 mois

| # | Issue | Action | Statut | Date |
|---|---|---|---|---|---|
| M1 | [#107](https://github.com/digitaleflex/nba/issues/107) | CSP (Content-Security-Policy) | ✅ | 2026-07-19 |
| M2 | [#108](https://github.com/digitaleflex/nba/issues/108) | `hardDeleteUser` self-service GDPR | ✅ | 2026-07-19 |
| M3 | [#109](https://github.com/digitaleflex/nba/issues/109) | Zod sur tous les PUT/PATCH | ✅ | 2026-07-19 |
| M4 | [#110](https://github.com/digitaleflex/nba/issues/110) | Cleanup auto audit-logs + KYC rows | ✅ | 2026-07-19 |
| M5 | [#111](https://github.com/digitaleflex/nba/issues/111) | Rôles DB séparés (read-only app) | ✅ | 2026-07-19 |
| M6 | [#112](https://github.com/digitaleflex/nba/issues/112) | Scan antivirus uploads (ClamAV) | ✅ | 2026-07-19 |
| M7 | [#113](https://github.com/digitaleflex/nba/issues/113) | Monitoring sécurité (Sentry alerts, fail2ban) | ✅ | 2026-07-19 |

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
Score : 100/100 (+9)
Phase 1 : 8/8  ██████████████████████  100% ✅
Phase 2 : 8/8  ██████████████████████  100% ✅
Phase 3 : 7/7  ██████████████████████  100% ✅
────
Total   : 23/23 ██████████████████████ 100% ✅
```

---

## LOG D'INTERVENTION

| Date | Qui | #Issue | Action |
|---|---|---|---|
| 2026-07-19 | Audit | - | Création du plan suite au MASTER_SECURITY_AUDIT |
| 2026-07-19 | opencode | Q1-Q8 | Phase 1 terminée — 8/8 Quick Wins — score 56 → 76 |
| 2026-07-19 | opencode | M1-M7 | Phase 3 terminée — 7/7 Moyen terme — score 91 → 100 |
| 2026-07-19 | opencode | - | 🎉 REMÉDIATION TERMINÉE — 23/23 — 56 → 100/100 |

---

*Fichier de suivi local — synchronisé avec les milestones et issues GitHub.*
*Mettre à jour les statuts après chaque session.*
