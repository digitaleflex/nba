# Crons NBA (Resend webhooks hardening)

Crons installes sur le VPS le 2026-07-13 (programme #audit-resend).

## Planning

| Cron | Frequence | Script | But |
|---|---|---|---|
| `0 * * * *` | Toutes les heures | `email-stuck-pending.ts` | Marquer FAILED les livraisons EMAIL PENDING > 1h |
| `0 2 * * *` | Tous les jours 2h | `email-reputation-check.ts` | Calculer bounce/complaint rate + alerte admin si seuils |
| `0 3 1 * *` | 1er du mois 3h | `cleanup-ghost-access.ts` | Revoquer les acces APPROVED des users inactifs/supprimes |
| `0 4 * * 0` | Dimanche 4h | `cleanup-email-events.ts` | GDPR : aggreger + supprimer email_events > 6 mois |
| `0 8 * * *` | Tous les jours 8h | `email-daily-digest.ts` | Digest HTML quotidien envoye a l'admin |
| `0 9 * * 1` | Lundi 9h | `journal-weekly-report.ts` | Rapport hebdomadaire du journal de trading aux membres |
| `0 5 * * 0` | Dimanche 5h | `cleanup-auth-attempts.ts` | Supprimer les login_attempts (connexion/inscription) > 90 jours |

## Logs

Tous les logs sont dans `/home/audest/logs/` :
- `nba-email.log` (stuck pending)
- `nba-rep.log` (reputation)
- `nba-cleanup.log` (ghost access)
- `nba-email-gdpr.log` (GDPR)
- `nba-digest.log` (digest)

## Verification

```bash
# Voir les crons installes
crontab -l

# Suivre un log en temps reel
tail -f /home/audest/logs/nba-email.log

# Lancer un script manuellement
cd /home/audest/nba
npx tsx scripts/email-stuck-pending.ts --dry-run
```

## Seuils configurables

- Stuck pending : 1h (constante `STUCK_THRESHOLD_MS`)
- Stuck alert : > 5 (constante `ALERT_THRESHOLD`)
- Reputation bounce danger : 5% (`BOUNCE_THRESHOLD_DANGER`)
- Reputation complaint danger : 0.1% (`COMPLAINT_THRESHOLD_DANGER`)
- Delivery delayed burst : > 10/1h (`DELAYED_BURST_THRESHOLD`)
- GDPR retention : 6 mois (`RETENTION_MONTHS`)
- Digest : `DIGEST_ENABLED=true` (defaut)
