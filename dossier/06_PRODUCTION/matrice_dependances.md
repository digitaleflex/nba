# 🔗 Matrice des dépendances tierces

> **Registre de tous les services externes** utilisés par SignauxX avec criticité, SLA, coûts et alternatives.

---

## 📊 Tableau récapitulatif

| # | Service | Catégorie | Criticité | SLA | Coût/mois | Depuis | Alternative |
|---|---|---|---|---|---|---|---|
| 1 | Neon | Database | 🔴 Critique | 99,95 % | Variable | 25 juin 2026 | Supabase, RDS |
| 2 | Resend | Email | 🔴 Critique | 99,9 % | ~20$ | 25 juin 2026 | SendGrid, Mailgun |
| 3 | Better Auth | Auth (lib) | 🔴 Critique | — | Gratuit | 25 juin 2026 | NextAuth, Clerk |
| 4 | Tailscale | VPN | 🟠 Important | 99,9 % | Gratuit | 3 juillet 2026 | WireGuard |
| 5 | Sentry | Monitoring | 🟠 Important | 99,9 % | 0-26$ | 3 juillet 2026 | Rollbar, Bugsnag |
| 6 | Backblaze B2 | Backup | 🔴 Critique | 99,9 % | ~5$ | 3 juillet 2026 | S3 Glacier |
| 7 | Cloudflare | DNS/CDN | 🟠 Important | 99,99 % | Gratuit | 25 juin 2026 | Route53 |
| 8 | GitHub Container Registry | Registry | 🟠 Important | 99,9 % | Gratuit | 3 juillet 2026 | Docker Hub |
| 9 | AWS S3 | Storage | 🟡 Utile | 99,9 % | Variable | 25 juin 2026 | R2, B2 |
| 10 | GitHub Actions | CI/CD | 🟠 Important | 99,9 % | Gratuit | 25 juin 2026 | CircleCI |
| 11 | Stripe / PayPal | Paiement | 🟠 Important | 99,99 % | 2,9 % | À venir | Mollie |
| 12 | Vercel (alternative) | Hosting | 🟡 Optionnel | 99,99 % | Variable | Jamais utilisé | Railway |

---

## 🔴 Services CRITIQUES (sans eux = arrêt total)

### 1. Neon (PostgreSQL serverless)

| | |
|---|---|
| **Catégorie** | Database managée |
| **Site** | neon.tech |
| **Plan** | Launch (pay-as-you-go) |
| **Coût mensuel** | Variable (~10-50$ selon usage) |
| **Localisation** | US East (AWS) |
| **SLA garanti** | 99,95 % |
| **Pourquoi ce choix** | Serverless, auto-scaling, branch par commit, pooling intégré |
| **Points faibles** | US uniquement, prix variables |
| **Alternative 1** | Supabase (Postgres managé) — plus riche fonctionnellement |
| **Alternative 2** | AWS RDS — contrôle total mais plus complexe |
| **Alternative 3** | Railway Postgres — simple, EU dispo |
| **Procédure de bascule** | Provisionner nouvelle instance + `pg_dump` + `pg_restore` |

### 2. Resend (Email transactionnel)

| | |
|---|---|
| **Catégorie** | Email API |
| **Site** | resend.com |
| **Plan** | Pro (~20$/mois) |
| **SLA** | 99,9 % (annoncé, pas contractuel) |
| **Volume** | ~10 000 emails/mois |
| **Pourquoi ce choix** | DX excellente, API simple, React Email intégré |
| **Points faibles** | Pas de MFA intégré, peu d'analytics |
| **Alternative 1** | SendGrid — plus mature, analytics riches |
| **Alternative 2** | Mailgun — économique |
| **Alternative 3** | AWS SES — pas cher mais complexe |
| **Procédure de bascule** | Créer compte, vérifier domaine, changer `RESEND_API_KEY` dans .env |

### 3. Better Auth (Librairie d'authentification)

| | |
|---|---|
| **Catégorie** | Auth library (open source) |
| **Site** | better-auth.com |
| **Licence** | Open source (MIT-like) |
| **Coût** | Gratuit |
| **Version actuelle** | 1.6.25 |
| **Pourquoi ce choix** | Moderne, TypeScript-first, RBAC-friendly, OAuth-ready |
| **Points faibles** | Librairie jeune, breaking changes possibles |
| **Alternative 1** | NextAuth (Auth.js) — mature mais vieillissant |
| **Alternative 2** | Clerk — excellent mais cher, vendor lock-in |
| **Alternative 3** | Lucia — DIY, plus de contrôle |
| **Procédure de bascule** | Réécrire `src/lib/auth/*` (estimé 5 j-h) |

### 6. Backblaze B2 (Backup)

| | |
|---|---|
| **Catégorie** | Object Storage |
| **Site** | backblaze.com |
| **Plan** | Pay-as-you-go |
| **Coût** | ~5$/mois (100 GB) |
| **SLA** | 99,9 % |
| **Localisation** | US West + EU (régions dispo) |
| **Pourquoi ce choix** | 1/4 du prix de S3, intégration S3-compatible |
| **Points faibles** | UI moins ergonomique que S3 |
| **Alternative 1** | AWS S3 Glacier — très pas cher pour archives |
| **Alternative 2** | Wasabi — pas cher, EU dispo |
| **Procédure de bascule** | Créer bucket + clé + changer `B2_*` dans .env |

---

## 🟠 Services IMPORTANTS (impact business significatif)

### 4. Tailscale (VPN mesh)

| | |
|---|---|
| **Catégorie** | Zero-config VPN |
| **Site** | tailscale.com |
| **Plan** | Personal (gratuit, 100 machines) |
| **Pourquoi** | Connecter VPS1 et VPS2 sans config réseau complexe |
| **Alternative 1** | WireGuard — DIY, plus de travail |
| **Alternative 2** | Cloudflare Tunnel — bonne intégration CDN |
| **Procédure de bascule** | Installer WireGuard manuellement (~1h) |

### 5. Sentry (Error tracking)

| | |
|---|---|
| **Catégorie** | APM / Error tracking |
| **Site** | sentry.io |
| **Plan** | Developer (gratuit) → Team (26$/mois) |
| **Volume** | ~10 000 events/mois |
| **Pourquoi** | Open source, self-hostable, intégrations riches |
| **Alternative 1** | Rollbar — similaire |
| **Alternative 2** | Bugsnag — focus mobile |
| **Alternative 3** | GlitchTip — self-hosted |
| **Procédure de bascule** | Changer `SENTRY_DSN` dans .env + adapter les call sites |

### 7. Cloudflare (DNS + CDN)

| | |
|---|---|
| **Catégorie** | DNS + CDN |
| **Plan** | Free (DNS uniquement) |
| **Pourquoi** | DNS rapide, propagation < 30s |
| **Alternative** | Route53, Namecheap DNS |
| **Procédure de bascule** | Changer les NS + recréer les records |

### 8. GitHub Container Registry

| | |
|---|---|
| **Catégorie** | Container registry |
| **Plan** | Gratuit (public) |
| **Pourquoi** | Intégré à GitHub Actions, pas de config |
| **Alternative** | Docker Hub (limité en pull) |

### 10. GitHub Actions (CI/CD)

| | |
|---|---|
| **Catégorie** | CI/CD |
| **Plan** | 2000 min/mois gratuit |
| **Pourquoi** | Intégré au repo, pas de service tiers |
| **Alternative** | CircleCI, GitLab CI, Drone |

---

## 🟡 Services UTILES (mais non bloquants)

### 9. AWS S3 (Storage média)

| | |
|---|---|
| **Catégorie** | Object Storage |
| **Usage** | KYC docs (avant cleanup), images signaux |
| **Alternative 1** | Cloudflare R2 — pas cher, S3-compat |
| **Alternative 2** | Backblaze B2 (même API) |
| **Procédure de bascule** | Changer `S3_*` dans .env + adapter upload scripts |

### 11. Stripe / PayPal (Paiement)

| | |
|---|---|
| **Catégorie** | Payment processor |
| **Statut** | À intégrer (pas encore utilisé en prod) |
| **Pourquoi Stripe** | API simple, webhooks puissants |
| **Pourquoi PayPal** | Couverture internationale,Afrique |
| **Alternative** | Mollie, Paddle |

---

## 📊 RÉPARTITION DES COÛTS MENSUELS

```
Hebergement VPS (Hetzner/OVH) :  ~50$
Neon database                 :  ~30$
Resend (emails)               :  ~20$
Sentry                        :  ~26$
Backblaze B2                  :  ~5$
AWS S3                        :  ~5$
Domaines (signauxx.com)      :  ~1$
─────────────────────────────────────
TOTAL ESTIMÉ                  : ~140$/mois ≈ 85 000 FCFA/mois
```

### Coût par utilisateur (au 3 sept 2026)
- 81 utilisateurs
- Coût par utilisateur : ~1,73 $/mois ≈ 1 050 FCFA/mois

### Break-even
Pour rentabiliser au tarif catalogue de 2 500 FCFA/mois (hypothèse) :
- Il faut **34 utilisateurs payants** pour couvrir les coûts
- Avec 81 utilisateurs, marge = **~58 %** sur coûts infra

---

## 🔄 STRATÉGIE DE RÉDUCTION DE DÉPENDANCE

### Court terme (6 mois)

| Action | Impact | Effort |
|---|---|---|
| Mettre en cache les emails sortants | -30 % coût Resend | 0,5 j |
| Compresser les images uploadées | -50 % coût S3 | 1 j |
| Self-host Sentry (optionnel) | -26 $/mois | 3 j |

### Moyen terme (1 an)

| Action | Impact | Effort |
|---|---|---|
| Multi-region Neon (US + EU) | Conformité RGPD | 2 j |
| Self-host auth (alternative Better Auth custom) | Indépendance vendor | 10 j |
| CDN auto-hébergé (optionnel) | -50 % trafic S3 | 5 j |

### Long terme (2 ans)

| Action | Impact |
|---|---|
| Migrer de Tailscale à WireGuard natif | Économie, contrôle |
| Multi-cloud (failover AWS → Hetzner) | Résilience |

---

## 📋 CHECKLIST VÉRIFICATION MENSUELLE

À faire le 1er de chaque mois :

- [ ] Vérifier que chaque service est UP (curl / page status)
- [ ] Vérifier les coûts sur chaque dashboard
- [ ] Vérifier les clés API (pas bientôt expirées)
- [ ] Vérifier les quotas (Neon compute, Resend emails, S3 storage)
- [ ] Vérifier les alertes configurées
- [ ] Vérifier qu'on n'utilise pas un service oublié

---

## 🔐 SÉCURITÉ DES SECRETS

Tous les secrets sont stockés dans :
1. **`.env`** (local, jamais commit grâce à `.gitignore`)
2. **GitHub Secrets** (pour CI/CD)
3. **Vault personnel** (pour archives)

### Liste des secrets critiques

| Variable | Service | Rotation recommandée |
|---|---|---|
| `DATABASE_URL` | Neon | 6 mois |
| `DIRECT_URL` | Neon | 6 mois |
| `REDIS_URL` | Redis | 6 mois |
| `RESEND_API_KEY` | Resend | 6 mois |
| `BETTER_AUTH_SECRET` | Better Auth | 12 mois |
| `SENTRY_DSN` | Sentry | non requis |
| `B2_KEY_ID` | Backblaze B2 | 6 mois |
| `B2_APP_KEY` | Backblaze B2 | 6 mois |
| `S3_ACCESS_KEY_ID` | AWS S3 | 6 mois |
| `S3_SECRET_ACCESS_KEY` | AWS S3 | 6 mois |
| `GHCR_TOKEN` | GitHub | 12 mois |
| `TAILSCALE_AUTH_KEY` | Tailscale | 12 mois |
| `STRIPE_SECRET_KEY` | Stripe (futur) | 12 mois |
| `PAYPAL_CLIENT_SECRET` | PayPal (futur) | 12 mois |

### Procédure de rotation

```bash
# 1. Générer nouveau secret sur le dashboard du fournisseur
# 2. Mettre à jour .env
nano .env

# 3. Mettre à jour GitHub Secrets
# → github.com/settings/secrets

# 4. Redéployer
git commit --allow-empty -m "chore: rotate RESEND_API_KEY"
git push origin main

# 5. Vérifier le déploiement
# → GH Actions > deploy workflow
# → Sentry / Neon / Resend dashboard
```

---

*Document confidentiel — usage strictement privé*
*Dernière mise à jour : 3 septembre 2026*
*À mettre à jour à chaque ajout/suppression de dépendance*