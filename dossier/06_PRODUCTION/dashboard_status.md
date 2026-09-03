# 🚀 État de production — 3 septembre 2026

> Source : interrogation directe base Neon + GHCR + GitHub API

---

## ✅ Statut global : EN LIGNE

| Composant | Statut |
|---|---|
| Application Next.js (VPS1) | ✅ UP |
| Worker BullMQ (VPS2) | ✅ UP |
| Base de données | ✅ UP |
| Redis | ✅ UP |
| Tailscale (VPN inter-VPS) | ✅ UP |
| Traefik (reverse proxy) | ✅ UP |
| Sentry (error tracking) | ✅ UP |
| Backblaze B2 (backup) | ✅ UP |
| Resend (email) | ✅ UP |
| GHCR (images Docker) | ✅ UP |

---

## 👥 Utilisateurs en production

### Répartition globale

| Catégorie | Nombre |
|---|---|
| **Membres (MEMBER)** | 76 |
| **Admins (ADMIN + SUPER_ADMIN)** | 5 |
| **Total** | **81** |

### Top 10 des plus anciens

| Email | Nom | Date inscription | Rôle |
|---|---|---|---|
| `elzohoundjo782@gmail.com` | Elzo Houndjo | 2026-07-03 17:06 | ADMIN |
| `dimitrihoundjo5@gmail.com` | Dimitri Houndjo | 2026-07-03 17:08 | ADMIN |
| `digitaleflex@gmail.com` | Hash | 2026-07-03 19:56 | MEMBER (fondateur) |
| `admin@signauxx.com` | Support NBA | 2026-07-03 20:05 | SUPER_ADMIN |
| `fanoquenum05@gmail.com` | EMERSON QUENUM | 2026-07-05 17:55 | ADMIN |
| **`yvonnedatey@gmail.com`** | **Dedevi Ablavi Thérèse Y. DATEY** | **2026-07-06 07:43** | **MEMBER (1er public)** |
| `bossouharold@gmail.com` | Harold Bossou | 2026-07-06 17:59 | MEMBER |
| `sannihaamou99@gmail.com` | Haamou SANNI | 2026-07-06 17:59 | MEMBER |
| `ezekielromelus@gmail.com` | Romelus Adjovi | 2026-07-06 18:03 | MEMBER |
| `kpehoundemiracle@gmail.com` | Miracle KPEHOUNDE | 2026-07-06 18:04 | MEMBER |

---

## 🗄️ Base de données (PostgreSQL sur Neon)

### Tables actives (42 au total)

```
access_requests              notifications
accounts                     notification_deliveries
audit_logs                   permissions
broker_verifications         push_subscriptions
conversation_participants    role_permissions
conversations                roles
daily_reflections            security_events
device_verifications         security_policies
devices                      sessions
email_events                 settings
email_reputation_history     signal_archives
email_stats_monthly          signal_audience
journal_sessions             signal_favorites
kyc_documents                signal_reads
login_attempts               signal_versions
message_reactions            signals
message_reports              streaks
messages                     subscription_plans
                             trades
                             two_factor_backup_codes
                             users
                             verifications
                             webhook_dlq
```

### Index de performance

- `notifications_created_at_idx`
- `audit_logs_created_at_id` (intégrité + recherche)
- `signals_status_created_at_idx`
- `signals_status_deleted_at_idx` (composite)
- `messages_conversation_id_created_at_idx`
- `access_requests_status_created_at_idx`
- `login_attempts_type_success_created_at_idx`
- + indexes composites créés en juillet 2026 (perf DB)

---

## 🔐 Audit de sécurité

### État `pnpm audit`

```
$ pnpm audit --prod
✨ Done in 0.5s — 0 vulnerabilities
```

### Vulnérabilités historiques corrigées

| Date | Commit | Description |
|---|---|---|
| 31 juillet | `de10ef4` | 21 vulnérabilités corrigées |
| 31 août | `7571ab5` | nanoid, undici, ip-address, dompurify, socket.io-parser |
| 31 août | `a48b99b` | Next.js 16.2.12, sharp 0.35.4 |

---

## 🐳 Images Docker publiées (GHCR)

```
ghcr.io/digitaleflex/nba/app:latest       # Dernière build app
ghcr.io/digitaleflex/nba/app:sha-{short}  # Build par commit
ghcr.io/digitaleflex/nba/worker:latest    # Worker
```

### Déploiements récents

- 31 août 2026 : `v2.5.0` (security hardening)
- 26 août 2026 : `v2.4.0` (refonte admin UI)
- 5 août 2026 : `v2.3.0` (module journal)

---

## 💾 Backups

### Configuration

- **Stockage** : Backblaze B2
- **Fréquence** : Cron quotidien à 2h du matin
- **Contenu** :
  - Dump DB (pg_dump compressé)
  - Storage complet (S3 + B2 mirror)
  - Fichier `.env` (chiffré)
- **Rétention** : 30 derniers jours
- **Alertes** : Email (Resend) + Discord webhook en cas d'échec

### Script principal

`scripts/backup.sh` (en production, exécuté par cron VPS2)

---

## 📊 Métriques opérationnelles

### Sentry (30 derniers jours)

- Erreurs critiques : 0
- Erreurs warnings : <10 (mineures)
- Performance p95 : <500ms (à confirmer)

### Disponibilité

- Uptime VPS1 : >99,5 % (sondes internes)
- Uptime VPS2 : >99,9 %
- Uptime Neon : garanti 99,9% (SLA Neon)

---

## 🌐 Domaines actifs

| Domaine | Usage |
|---|---|
| `signauxx.com` | Production principale |
| `access.signauxx.com` | Admin Bull Board (monitoring queue) |

---

## 🔄 Pipeline CI/CD

### À chaque push sur `main` :

1. ✅ Tests vitest (avec coverage)
2. ✅ Typecheck TypeScript
3. ✅ Lint ESLint
4. ✅ Scan sécurité (`pnpm audit`)
5. ✅ Build Docker (multi-stage)
6. ✅ Push GHCR (image tagguée par SHA)
7. ✅ Deploy VPS1 (pull + restart)
8. ✅ Deploy VPS2 (pull + restart)

### Temps de build moyen

- Premier run (cold cache) : ~10 minutes
- Runs suivants (cache warm) : <3 minutes

---

*Document confidentiel — usage strictement privé*
*Données au 3 septembre 2026*