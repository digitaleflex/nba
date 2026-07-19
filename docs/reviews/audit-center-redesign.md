# CENTRE D'AUDIT — RAPPORT D'AUDIT & PLAN DE REFONTE

> Projet : Never Broke Again (NBA)
> Version : 1.0.0
> Date : 2026-07-19

---

## SYNTHÈSE EXÉCUTIVE

**Problème racine** : Le journal actuel a été construit par sédimentation — chaque développeur a ajouté son `prisma.auditLog.create()` sans vision globale. Résultat : 2 UIs incohérentes, 3 conventions de nommage, du JSON brut affiché aux admins, et zéro intégrité.

**Solution** : Un module unique `src/lib/audit/` comme source de vérité, un seul composant UI, des renderers qui transforment chaque événement en phrase française compréhensible, et une chaîne d'intégrité pour la valeur juridique.

**Temps total estimé** : ~47h (~6 jours) répartis en 4 phases.

---

## ARCHITECTURE ACTUELLE

| Couche | Fichier | Rôle |
|---|---|---|
| Modèle | `prisma/schema.prisma:599` | `AuditLog` — 8 champs, 4 index |
| Service | `src/lib/services/audit.ts` | `logAuditEvent()` — 33 lignes |
| API | `src/app/api/admin/audit-logs/route.ts` | GET paginé + DELETE purge |
| UI page | `src/app/(admin)/admin/audit/page.tsx` | 351 lignes |
| UI onglet | `src/app/(admin)/admin/features/AuditTab.tsx` | 897 lignes |
| Sidebar | `src/app/(admin)/components/admin-sidebar.tsx` | 2 liens concurrents |

**Volume** : ~40 actions dans 20+ fichiers, 17 resourceTypes, cache 300s, 2 patterns d'écriture.

---

## DÉTECTION DES PROBLÈMES

### P1 — Deux UIs concurrentes et incohérentes (CRITIQUE)

Page dédiée et onglet dashboard sont 2 implémentations distinctes avec leurs propres maps de labels, couleurs, formatage.

- **UX** : Labels différents selon l'endroit → confusion
- **Maintenance** : Une correction = 2 endroits
- **Durée** : 4h

### P2 — Conventions de nommage anarchiques (HAUTE)

Trois conventions coexistent : `signal.publish` (dot.case), `CREATE` (UPPER_CASE), `access_request.approved` (snake_case).

- **UX** : Filtres peu fiables, labels maps incomplètes
- **Recommandation** : `{resource}.{verbe_passe}` unique
- **Durée** : 5h

### P3 — UUIDs comme information principale (HAUTE)

`getResourceSummary()` affiche des UUID bruts. Aucun `resourceLabel` lisible.

- **Métier** : Impossible de retrouver une ressource par son nom
- **Recommandation** : `resourceLabel` dans chaque entrée d'audit
- **Durée** : 6h

### P4 — Raw JSON exposé aux admins (HAUTE)

`<pre>` JSON brut dans les 2 UIs. Détails semi-structurés mais incompréhensibles.

- **Confiance** : Outil qui ressemble à du debug, pas à un produit pro
- **Recommandation** : Renderers typés par (resourceType, action) → phrases françaises
- **Durée** : 8h

### P5 — Cache 5 min masque événements récents (CRITIQUE)

`unstable_cache` TTL 300s → action faite n'apparaît pas avant 5 min.

- **UX** : Outil semble cassé, F5 frénétique
- **Recommandation** : Supprimer le cache
- **Durée** : 15 min

### P6 — Pas de vue « parcours utilisateur » (HAUTE)

Pas possible de voir tout l'historique d'un user spécifique.

- **Métier** : Impossible pour conformité GDPR, support, enquête sécurité
- **Recommandation** : Vue parcours par utilisateur + par ressource
- **Durée** : 2h

### P7 — Pas d'export PDF conformité (MOYENNE)

Export CSV basique, pas de filtre période, pas d'horodatage signé.

- **Juridique** : Non recevable pour un cabinet d'audit
- **Recommandation** : Export PDF horodaté + signature SHA256
- **Durée** : 6h

### P8 — Aucune intégrité des logs (HAUTE)

SUPER_ADMIN peut supprimer des logs. Aucune chaîne de hachage.

- **Sécurité** : Logs non recevables juridiquement
- **Recommandation** : Hash chaîné (Merkle ou previousHash) + table AuditIntegrity
- **Durée** : 8h

### P9 — Performances recherche dégradées (HAUTE)

`contains` sur 4 colonnes → full scan. Pas d'index full-text PostgreSQL. Pas de politique d'archivage.

- **Scalabilité** : Table croît indéfiniment
- **Recommandation** : GIN tsvector + rétention (archive > 1 an, delete > 3 ans)
- **Durée** : 4h

### P10 — Pas de temps réel (MOYENNE)

Page statique. Socket.IO déjà présent dans le projet.

- **Sécurité** : En cas d'attaque, admin ne voit rien
- **Recommandation** : `audit:new-entry` via Socket.IO
- **Durée** : 3h

### P11 — Sidebar confuse (HAUTE)

Deux liens sidebar : `Journal` → `/admin?tab=audit` et `Audits` → `/admin/audit`.

- **UX** : Admin ne comprend pas la différence
- **Recommandation** : Un seul lien « Centre d'audit »
- **Durée** : 1h

### P12 — Résumé ressource inutile (HAUTE)

`getResourceSummary()` tronque le contenu à 80 car. → `« contenu du signal tronqué a... »`.

- **Recommandation** : Remplacé par `resourceLabel` (inclus dans P3)
- **Durée** : Inclus P3

---

## PHASES D'IMPLÉMENTATION

### Phase 1 — Corrections immédiates (1h)
- [ ] P5 — Supprimer cache 5 min (15 min)
- [ ] P11 — Sidebar unique (30 min)

### Phase 2 — Refonte UX/UI (3 jours)
- [ ] P1 — Fusionner 2 UIs → AuditCenter unique (4h)
- [ ] P2 — Standardiser nommage + registre central (5h)
- [ ] P3 — resourceLabel dans logAuditEvent (6h)
- [ ] P4 — Renderers typés → phrases françaises (8h)
- [ ] P6 — Vue parcours utilisateur (2h)

### Phase 3 — Fondations (2 jours)
- [ ] P8 — Chaîne d'intégrité (8h)
- [ ] P9 — Full-text search + rétention (4h)
- [ ] P10 — Socket.IO live feed (3h)

### Phase 4 — Conformité (2 jours)
- [ ] P7 — Export PDF signé (6h)
- [ ] Tests + documentation (6h)

---

## ARCHITECTURE CIBLE

```
src/
├── lib/audit/                     # Module central (NOUVEAU)
│   ├── types.ts                   # AuditAction, AuditResourceType
│   ├── actions.ts                 # Registre de toutes les actions
│   ├── labels.ts                  # Source unique des labels
│   ├── renderers.ts               # Renderers par (resourceType, action)
│   └── integrity.ts               # Vérification de chaîne
├── lib/services/audit.ts          # logAuditEvent() enrichi
├── app/
│   ├── (admin)/admin/audit/
│   │   └── page.tsx               # SEULE page d'audit
│   └── api/admin/audit-logs/
│       ├── route.ts               # API sans cache
│       └── export/route.ts        # Export PDF (NOUVEAU)
└── components/
    └── audit/                     # Composants partagés (NOUVEAU)
        ├── audit-center.tsx
        ├── audit-timeline.tsx
        ├── audit-card.tsx
        ├── audit-user-journey.tsx
        ├── audit-details.tsx
        ├── audit-filters.tsx
        └── audit-live-feed.tsx
```

## CONVENTION DE NOMMAGE UNIQUE

```
{resource}.{verbe_passe}

✅ signal.created        ✅ kyc.approved
✅ signal.published      ✅ kyc.rejected
✅ signal.updated        ✅ broker.approved
✅ signal.deleted        ✅ broker.rejected
✅ signal.duplicated     ✅ access.approved
✅ signal.distribution   ✅ access.rejected
✅ user.suspended        ✅ access.revoked
✅ user.reactivated      ✅ access.suspended
✅ user.role_changed     ✅ webhook.dlq_replayed
✅ user.sessions_revoked ✅ webhook.dlq_abandoned
✅ user.email_bounced    ✅ system.cache_purged
✅ user.email_complained ✅ system.queue_retried
✅ user.email_suppressed ✅ session.login_failed
✅ impersonation.started ✅ impersonation.stopped
```
