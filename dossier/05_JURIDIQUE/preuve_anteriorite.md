# 📜 Preuve d'antériorité — NBA / SignauxX

> **Document de preuve intellectuelle** pour archive personnelle et/ou cession.

---

## 🎯 Objet

Établir formellement que le projet **NBA / SignauxX** a été créé et développé par **digitaleflex** à compter du **25 juin 2026**, et que l'ensemble du code source, de la documentation et de l'infrastructure associés sont la propriété intellectuelle de cet auteur.

---

## 🔐 Preuve cryptographique (Git)

### Commit racine (origin)

```bash
$ git log --reverse --format="%H | %ai | %an | %s" | head -1

967427b | 2026-06-25 13:21:03 +0100 | digitaleflex | chore: initial project scaffold
```

- **Hash** : `967427b...` (SHA-1, vérifiable sur GitHub)
- **Date** : 25 juin 2026 13:21:03 UTC+1
- **Auteur** : digitaleflex
- **Message** : `chore: initial project scaffold`

### Commit final (état au 3 septembre 2026)

```bash
$ git log --format="%H | %ai | %an | %s" -1

b10f4eb | 2026-08-31 14:27:51 +0000 | digitaleflex | fix(security): injecte le nonce CSP...
```

---

## 🌐 Preuve externe (GitHub)

| Élément | URL / Référence |
|---|---|
| **Repository public** | `github.com/digitaleflex/nba` |
| **Date de création** | Vérifiable dans l'API GitHub |
| **Branche principale** | `main` |
| **Tags versionnés** | v1.0.0 → v2.5.0 (8 releases) |
| **Stars / Forks** | Données publiques |

### Vérification publique (par tout tiers)

```bash
# Vérifier que le commit racine existe et sa date
git clone https://github.com/digitaleflex/nba.git
cd nba
git log --reverse --format="%H %ai %s" | head -1

# Réponse attendue :
# 967427b... 2026-06-25 13:21:03 +0100 chore: initial project scaffold
```

---

## 📋 Engagement de l'auteur

Je soussigné, **digitaleflex**, déclare sur l'honneur :

1. Être l'**auteur unique principal** du projet NBA / SignauxX depuis sa création le 25 juin 2026.

2. Avoir réalisé **~93 % des commits** (850 / 913 totaux), avec **2,6 %** de co-contributions de `Eflex` (collaborateur déclaré).

3. Que **les commits restants** sont :
   - 40 commits de `dependabot[bot]` (mises à jour automatiques de dépendances)
   - ~24 commits de merge (intégration de branches)

4. Que **toute la propriété intellectuelle** (code source, design system, base de données, infrastructure, documentation) m'appartient sauf mention contraire dans les fichiers de licence tiers (Prisma, Next.js, etc. — open source).

5. Que **ce projet n'utilise aucun code sous licence copyleft forte** (GPL, AGPL) qui obligerait à la publication forcée du code source complet.

---

## 📚 Open source vs proprietary

### Composants open source utilisés (licence OK pour usage commercial)

| Technologie | Licence | Compatibilité commerciale |
|---|---|---|
| Next.js | MIT | ✅ |
| Prisma | Apache 2.0 | ✅ |
| BullMQ | MIT | ✅ |
| Better Auth | MIT | ✅ |
| Recharts | MIT | ✅ |
| Tailwind CSS | MIT | ✅ |
| Socket.IO | MIT | ✅ |
| Zod | MIT | ✅ |
| Resend SDK | MIT | ✅ |
| Sentry SDK | MIT | ✅ |
| Sonner | MIT | ✅ |

### Aucun composant GPL / AGPL / SSPL détecté

```bash
$ grep -r "GPL\|AGPL\|SSPL" package.json
# (vide — aucun composant copyleft fort)
```

---

## 📜 Clause de licence du projet

**Statut par défaut** : Tous droits réservés © 2026 digitaleflex.

### Options possibles en cas de cession

| Licence | Description | Usage |
|---|---|---|
| **Propriétaire** (par défaut) | Code privé, aucun droit de redistribution | Cession exclusive |
| **MIT** | Libre utilisation, modification, distribution | Open source |
| **Source-available** | Code visible pour usage interne uniquement | Audit / formation |
| **White-label** | Licence multi-clients avec branding personnalisable | SaaS B2B |

---

## 📑 Annexes — éléments d'archive

### Captures d'écran à archiver (à produire)

- [ ] `screenshots/github_first_commit.png` — Preuve visuelle du commit racine sur GitHub
- [ ] `screenshots/github_releases.png` — Liste des 8 releases
- [ ] `screenshots/git_log_local.png` — git log local daté
- [ ] `screenshots/Neon_dashboard.png` — Connexion Neon datée
- [ ] `screenshots/GHCR_packages.png` — Images Docker publiées
- [ ] `screenshots/sentry_dashboard.png` — Activité Sentry datée
- [ ] `screenshots/psql_users.png` — Liste des 81 utilisateurs datée

### Empreintes numériques à conserver

| Élément | Valeur |
|---|---|
| Hash SHA-256 du repo tarball | à calculer : `git archive \| sha256sum` |
| Date du tarball | date de génération |
| Signature GPG (recommandé) | signer le commit final |
| Timestamp blockchain (optionnel) | OpenTimestamps pour preuve ultime |

---

## 🖋️ Signature

```
Fait à ____________________, le ___/___/______

Nom : ____________________

Signature : ____________________
```

---

*Document confidentiel — usage strictement privé*
*À signer et dater avant toute transmission à un tiers*