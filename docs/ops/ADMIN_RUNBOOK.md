# Runbook Admin — NeverBrokeAgain

## Anti-Fraude

### Suspendre un compte
1. Aller dans `Admin → Anti-Fraude`
2. Saisir l'email dans "Suspendre un compte"
3. Confirmer → session revoke + email envoyé à l'utilisateur

### Réactiver un compte
1. Aller dans `Admin → Anti-Fraude` 
2. Saisir l'email dans "Réactiver un compte"
3. Confirmer → compte réactivé

### Exécuter un playbook
1. Chercher l'utilisateur par email
2. Sélectionner le playbook (ex: Credential Stuffing, Session Hijack)
3. Confirmer → actions automatiques (revoke, suspend, block IP...)

### Débloquer une IP
1. Aller dans `Admin → Anti-Fraude`
2. Cliquer sur le cadenas à côté de l'IP
3. Confirmer → IP retirée du blocage Redis

## Sécurité

### Sessions actives
- Visible dans `Admin → Sécurité`
- Possibilité de révoquer une session individuellement

### Événements de sécurité
- Les événements HAUT/CRITIQUE sont visibles dans l'onglet Anti-Fraude
- Conservation : 90 jours (INFO), 180 jours (WARNING), 365 jours (HIGH), 730 jours (CRITICAL)

## Sauvegarde et Restauration

### Backup automatique
- Exécuté avant chaque déploiement
- Dump PostgreSQL (chiffré si GPG configuré) → Backblaze B2
- Fichiers uploadés → Backblaze B2

### Restauration manuelle
```bash
# Télécharger le dernier dump
b2 file download B2_BUCKET db-YYYY-MM-DD_HH-MM-SS.dump /tmp/restore.dump

# Restaurer (non chiffré)
pg_restore --no-owner --no-acl -d "$DATABASE_URL" /tmp/restore.dump

# Restaurer (chiffré)
gpg --decrypt /tmp/restore.dump.gpg | pg_restore --no-owner --no-acl -d "$DATABASE_URL"
```

## URLs Admin

| Page | URL |
|---|---|
| Dashboard | `/admin?tab=dashboard` |
| Sécurité | `/admin?tab=security` |
| Anti-Fraude | `/admin?tab=fraud` |
| Audit | `/admin?tab=audit` |
| Files d'attente | `/admin/queues` |
