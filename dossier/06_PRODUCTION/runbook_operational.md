# 🛠️ Runbook Opérationnel — SignauxX

> **Procédures d'urgence** pour les administrateurs et l'équipe de maintenance.
> **À imprimer** et garder accessible hors-ligne.

---

## 📞 CONTACTS D'URGENCE

| Rôle | Contact | Disponibilité |
|---|---|---|
| **Lead Tech** | digitaleflex | 24/7 (téléphone ci-dessous) |
| **Infogérance VPS** | Hetzner / OVH support | 24/7 selon SLA |
| **Neon (DB)** | support@neon.tech | Support en ligne |
| **Sentry** | support@sentry.io | Support en ligne |
| **Backblaze B2** | support@backblaze.com | Support en ligne |
| **Discord alertes** | webhook configuré dans VPS2 | Auto |

```
📞 Téléphone d'urgence : ____________________ (à compléter)
💬 Slack / Discord ops : ____________________ (à compléter)
📧 Email ops : ops@signauxx.com (à créer)
```

---

## 🚨 NIVEAUX DE Sévérité

| Niveau | Description | Délai réponse | Délai résolution |
|---|---|---|---|
| **P0** | Service totalement indisponible | 15 min | 4h |
| **P1** | Fonctionnalité majeure cassée | 1h | 8h |
| **P2** | Bug isolé / non-bloquant | 4h | 24h |
| **P3** | Cosmétique / amélioration | 24h | 7 jours |

---

# 🔥 SCÉNARIOS D'URGENCE

## Scénario 1 — Service totalement indisponible (P0)

### Symptômes
- VPS1 down (ne répond pas au SSH/HTTP)
- VPS2 down
- Neon DB inaccessible

### Diagnostic

```bash
# 1. Vérifier VPS1
ping signauxx.com
curl -I https://signauxx.com

# 2. Vérifier VPS2
ssh worker "docker ps"

# 3. Vérifier Neon (depuis la machine locale)
psql $DATABASE_URL -c "SELECT 1"

# 4. Vérifier Sentry
# → https://sentry.io/issues/?project=...
```

### Actions correctives

#### Si VPS1 down :
```bash
# Option A : Via le panneau Hetzner/OVH
1. Se connecter au panneau
2. Forcer reboot hard
3. Attendre 3-5 minutes
4. Vérifier que les containers Docker redémarrent

# Option B : Si le VPS ne redémarre pas
1. Provisionner un nouveau VPS
2. Pousser l'image GHCR : docker pull ghcr.io/digitaleflex/nba/app:latest
3. Lancer le compose : docker compose up -d
4. Restaurer les variables d'env depuis Vault
5. Vérifier les healthchecks
```

#### Si VPS2 down :
```bash
ssh worker
docker ps
docker compose logs --tail=50
docker compose restart
```

#### Si Neon down :
```bash
# 1. Vérifier status.neon.tech
# 2. Si > 30 min d'indisponibilité :
#    - Activer le mode dégradé (read-only via cache)
#    - Communiquer aux utilisateurs via Discord + email
#    - Préparer un fallback sur une DB secondaire (TODO: à configurer)
```

#### Si disque plein :
```bash
# VPS1
ssh vps1
df -h
docker system prune -a
du -sh /var/lib/docker/volumes/* | sort -h | tail

# VPS2
ssh worker
df -h
docker system prune -a
```

---

## Scénario 2 — Erreurs Sentry en cascade (P1)

### Symptômes
- Pic soudain d'erreurs (>50/minute)
- Mêmes erreurs sur plusieurs endpoints

### Diagnostic
1. Aller sur https://sentry.io/issues/
2. Identifier l'erreur la plus fréquente
3. Vérifier les déploiements récents
4. Vérifier l'état de Neon / Redis

### Actions correctives

```bash
# Si erreur suite à un déploiement
git log --oneline -10
# Identifier le commit fautif
# Rollback : déployer le commit précédent via GitHub Actions

# Sur VPS1
ssh vps1
docker pull ghcr.io/digitaleflex/nba/app:sha-{previous}
docker compose up -d

# Si erreur de base de données
# → vérifier migrations récentes
psql $DATABASE_URL -c "\dt"
git log --oneline --all prisma/migrations/ | head -10
```

---

## Scénario 3 — Fuite de sécurité suspectée (P0)

### Symptômes
- Connexions inhabituelles dans Sentry
- Login attempts multiples depuis IP inconnue
- Données utilisateur exposées

### Actions immédiates

```bash
# 1. Révoquer toutes les sessions actives
psql $DATABASE_URL -c "DELETE FROM sessions;"

# 2. Forcer reset password pour tous les admins
# Via Better Auth / admin panel

# 3. Vérifier les accès via audit logs
psql $DATABASE_URL -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;"

# 4. Changer les secrets critiques
# - DATABASE_URL (rotation Neon)
# - REDIS_URL (rotation Redis)
# - Better Auth secret
# - Resend API key
# - Sentry DSN (non critique mais recommandé)

# 5. Vérifier qu'aucun dump n'a fuité
# - Chercher les tokens sur github.com/alerts

# 6. Communiquer aux utilisateurs si confirmé
```

---

## Scénario 4 — Backup B2 échoué (P1)

### Symptômes
- Email d'alerte Resend reçu
- Webhook Discord non posté
- Pas de nouveau fichier dans le bucket B2

### Diagnostic
```bash
ssh worker
# Vérifier les logs du dernier backup
tail -100 /var/log/backup.log

# Tester manuellement
bash /home/worker/scripts/backup.sh

# Vérifier les credentials B2
cat /home/worker/.b2_credentials
b2 list-buckets
```

### Actions correctives

```bash
# Si credentials expirés :
# → régénérer une clé application sur backblaze.com
# → mettre à jour .env + redémarrer cron

# Si espace B2 plein :
# → augmenter la capacité ou supprimer vieux backups
b2 delete-file-version <bucket> <fileName> <fileId>

# Si le cron n'a pas tourné :
crontab -l
systemctl status cron
```

---

## Scénario 5 — Redis plein ou inaccessible (P1)

### Symptômes
- Jobs BullMQ bloqués
- Cache miss partout
- WebSocket déconnecté

### Diagnostic
```bash
ssh worker
docker ps | grep redis
redis-cli -u $REDIS_URL INFO memory
redis-cli -u $REDIS_URL DBSIZE
```

### Actions correctives

```bash
# Si Redis down
docker restart nba-redis

# Si Redis plein
docker exec nba-redis redis-cli FLUSHDB  # ⚠️ perd le cache
# OU plus chirurgical :
docker exec nba-redis redis-cli --scan --pattern 'bull:*' | xargs docker exec -i nba-redis redis-cli DEL

# Si disque plein (logs Redis)
docker exec nba-redis redis-cli CONFIG SET maxmemory 2gb
```

---

## Scénario 6 — Cache applicatif incohérent (P2)

### Actions
```bash
# Via l'API admin
curl -X POST https://signauxx.com/api/admin/cache/purge \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Ou via l'UI admin
# → Admin > Cache > Purge All
```

---

## Scénario 7 — Signal bloqué / non distribué (P2)

### Symptômes
- Un signal créé n'arrive pas aux membres
- Files BullMQ bloquées sur ce job

### Diagnostic
```bash
# Via Bull Board (UI)
# → https://signauxx.com:3001 (admin only)

# Ou via Redis CLI
redis-cli -u $REDIS_URL ZRANGE bull:signals:delayed 0 -1
redis-cli -u $REDIS_URL LRANGE bull:signals:wait 0 10
redis-cli -u $REDIS_URL LRANGE bull:signals:failed 0 10
```

### Actions correctives
```bash
# Replay un job failed
curl -X POST https://signauxx.com/api/admin/queues/replay \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"jobId": "xxx"}'

# Ou via l'UI admin
# → Admin > Queues > Failed > Retry
```

---

# 🔧 MAINTENANCE PRÉVENTIVE HEBDOMADAIRE

## Lundi matin (30 min)

```bash
# 1. Vérifier l'espace disque
ssh vps1 "df -h"
ssh worker "df -h"

# 2. Vérifier les logs d'erreur
# → Sentry dashboard

# 3. Vérifier le dernier backup B2
# → Email automatique envoyé à ops@signauxx.com

# 4. Vérifier les versions
pnpm outdated
# Planifier les mises à jour si critiques
```

## Vendredi après-midi (1h)

```bash
# 1. Vérifier les performances
# → recharts dashboard admin > MRR + rétention

# 2. Audit des comptes admin
psql $DATABASE_URL -c "SELECT email, last_login FROM users WHERE role_id IN (admin_roles);"

# 3. Rotation des logs
docker system prune -f

# 4. Vérification des backups B2
# → Tester une restauration à blanc sur un VPS secondaire
```

---

# 📊 INDICATEURS À SURVEILLER

## Métriques de santé

| Métrique | Seuil alerte | Outil |
|---|---|---|
| Uptime VPS1 | < 99 % | UptimeRobot |
| Uptime VPS2 | < 99 % | UptimeRobot |
| Latence API p95 | > 1s | Sentry |
| Taux d'erreur Sentry | > 1% / jour | Sentry |
| Espace disque VPS1 | > 80 % | df -h |
| Espace disque VPS2 | > 80 % | df -h |
| Espace B2 | > 80 % | B2 dashboard |
| Jobs BullMQ failed | > 10 / jour | Bull Board |
| Connexions DB actives | > 80 | Neon dashboard |

## Alertes automatiques

```yaml
# Configuré dans discord-webhook.sh (VPS2)
- Mémoire VPS > 90% → #ops-alerts
- Espace disque > 85% → #ops-alerts
- Backup B2 failed → #ops-alerts + email Resend
- Cron non exécuté > 24h → #ops-alerts
```

---

# 🔐 PROCÉDURES DE SÉCURITÉ

## Reset d'urgence du mot de passe admin

```bash
# Si l'accès admin est perdu :
psql $DATABASE_URL -c "
UPDATE users
SET password_hash = crypt('NOUVEAU_MOT_DE_PASSE', gen_salt('bf'))
WHERE email = 'admin@signauxx.com';
"
```

## Révocation d'urgence de toutes les sessions

```bash
psql $DATABASE_URL -c "DELETE FROM sessions;"
```

## Blocage d'une IP

```sql
-- Via l'API admin
POST /api/admin/security/fraud/blocked-ips
{ "ip": "1.2.3.4", "reason": "brute-force", "duration": 86400 }
```

---

# 📋 CHECKLIST POST-INCIDENT

Après chaque incident P0/P1, compléter :

```markdown
## Incident #[NUMERO] — [TITRE COURT]
- **Date** : ____/____/______ à ____h____
- **Niveau** : P0 / P1 / P2
- **Détecté par** : Sentry / Discord / Manuellement
- **Durée totale** : ____ min

### Chronologie
- HH:MM : détection
- HH:MM : première action
- HH:MM : résolution
- HH:MM : communication utilisateurs

### Cause racine
[Description technique]

### Actions correctives
- [ ] Fix appliqué
- [ ] Test de non-régression
- [ ] Monitoring ajouté
- [ ] Documentation mise à jour

### Communication
- [ ] Email aux utilisateurs (si impact)
- [ ] Post-mortem interne (ce document)
```

---

# 📚 RESSOURCES UTILES

| Ressource | URL |
|---|---|
| Status page | status.signauxx.com (à créer) |
| Sentry | https://sentry.io |
| Neon | https://console.neon.tech |
| Backblaze B2 | https://secure.backblaze.com |
| GHCR | https://github.com/digitaleflex/nba/pkgs/container/nba%2Fapp |
| Discord ops | (à créer) |

---

*Document confidentiel — usage strictement privé*
*À mettre à jour à chaque évolution de l'infra*
*Dernière mise à jour : 3 septembre 2026*