# 💎 01 — Valeur du projet SignauxX / NeverBrokeAgain

> **Synthèse de `estimation-valeur.md`** (analyse git complète du 3 septembre 2026) — chiffres audités, pas d'estimations marketing.

---

## 🎯 Résumé exécutif

| Paramètre | Valeur |
|-----------|--------|
| **Nom produit** | NeverBrokeAgain (NBA) — marque commerciale **SignauxX** |
| **Stack** | Next.js 16, React 19, TypeScript 6, Prisma 7, PostgreSQL (Neon), BullMQ, Socket.IO, Redis, Better Auth, Tailwind 4, Sentry |
| **Période de construction** | 25 juin → 31 août 2026 — **67 jours calendaires** |
| **Jours actifs (avec commits)** | 35 jours |
| **Jours-homme estimés** | **89 j-h** (≈ 11 semaines pleines) |
| **Productivité** | 1,33× (89 j-h / 67 j) — rythme fondateur |
| **Commits totaux** | 913 (dont 786 non-merge) |
| **Commits humains** | **773** (850 digitaleflex + 24 Eflex, hors bots dependabot) |
| **Releases versionnées** | 8 (v1.0.0 → v2.5.0) |
| **Utilisateurs production** | 81 |
| **Valeur médiane retenue** | **18 500 000 FCFA** (~27 500 € / ~30 000 $) |
| **Fourchette agence Europe** | 100 000 – 158 000 € |

---

## 📦 Volumétrie code — données brutes git

| Catégorie | Lignes (LOC) | Fichiers |
|-----------|-------------|----------|
| Code applicatif `src/` (TS/TSX) | 150 517 | 565 |
| Workers (BullMQ + WebSocket) | 1 136 | 4 |
| Scripts ops (TS/SH) | 2 607 | ~30 |
| Prisma schema + migrations SQL | 2 382 | 37 |
| CSS global | 1 | 1 |
| **TOTAL code pur** | **157 381 LOC** | **603 fichiers** |
| Tests (Vitest) | 5 410 | ~50 |
| Config / Infra (Docker, YAML, GH Actions) | — | 53 fichiers |
| Lignes ajoutées (git sans merges) | 193 309 | — |
| Lignes supprimées | 43 024 | — |

### Models Prisma : 29 principaux (43 avec tables techniques)

> Le dossier indique « 29 models » pour les entités métier ; le fichier `schema.prisma` compte **29 models métier + 14 tables techniques** (sessions, verifications, etc.) = 43 déclarations `model`.

Principaux models : `User, Role, Permission, SubscriptionPlan, AccessRequest, Signal, SignalAudience, SignalVersion, KycDocument, BrokerVerification, Trade, JournalSession, DailyReflection, Streak, Conversation, Message, Notification, AuditLog, SecurityPolicy, Device` + 9 autres.

---

## ⏱️ Comment on arrive à 89 jours-homme

### Méthode hybride retenue (croisement commits × LOC × intensité)

| Phase | Période | Jours calendaires | j-h estimés | Contenu |
|-------|---------|-------------------|-------------|---------|
| Bootstrap (Phase 0–1) | 25–28 juin | 4 j | **6 j-h** | 57 commits en 2 jours + scaffold Next.js |
| Affinement UX/UI (Phase 2) | 28–30 juin | 3 j | **5 j-h** | Design system, composants |
| v1.0 + Accessibilité (Phase 3) | 1–16 juil | 16 j | **14 j-h** | WCAG, Docker, onboarding |
| Audit + erreurs (Phase 4) | 17–23 juil | 7 j | **10 j-h** | Campagnes E10/E11/E14, audit |
| v2.0 Infra (Phase 5) | 23–31 juil | 9 j | **12 j-h** | Multi-VPS, Tailscale, GHCR |
| Robustesse signaux + messagerie (Phase 6–7) | 27–30 juil | 4 j | **8 j-h** | Hotfixes, chat temps réel |
| Journal trading (Phase 8) | 31 juil–5 août | 6 j | **7 j-h** | Module journal complet |
| Admin UI repensé (Phase 9) | 6–26 août | 21 j | **22 j-h** | Refonte 17 onglets admin |
| Hardening sécurité (Phase 10) | 27–31 août | 5 j | **5 j-h** | CSP nonce, patches deps |
| **TOTAL** | **25 juin → 31 août** | **67 j** | **89 j-h** | |

> Vérification : 773 commits × 45 min = 580 h brutes × 0,85 = 493 h + 20 j-h tests + 7 j-h infra = **89 j-h**.

### Signaux d'intensité

| Indicateur | Valeur |
|------------|--------|
| Commits / jour actif (moyenne) | 22,5 |
| Pic journalier | 84 commits (20 juillet) |
| Commits de nuit (22h–8h) | 248 (31,5 %) |
| Commits week-end | ~47 % |
| Commits 19h–23h | 33 % |

---

## 💸 Valorisation — 4 scénarios

### Tarif de base (sans bonus qualité)

| Scénario | Profil de référence | TJM | 89 j-h brut |
|----------|---------------------|-----|-------------|
| **A. Freelance Afrique francophone** | Senior fullstack | 120 000 FCFA | 10 680 000 FCFA |
| **B. Freelance Europe** | Senior fullstack | 700 € | 62 300 € |
| **C. Agence / ESN Europe** | Senior + marge ×1,8 | ~1 126 € | 100 000 € |
| **D. Startup US** | Senior SF/NYC | ~1 100 $ | 100 000 $ |

### Bonus qualité net : +58 %

| Bonus (+) | +73 % |
|-----------|-------|
| 8 releases | +5 % |
| 0 vulnérabilité (audit clean) | +8 % |
| CSP nonce + rate limiting + CSRF | +5 % |
| Tests Vitest (5 410 LOC) | +4 % |
| Accessibilité WCAG (campagne #001–#025) | +5 % |
| Multi-VPS distribué (Tailscale) | +10 % |
| CI/CD GitHub Actions + GHCR | +4 % |
| Backup B2 + alertes Discord/email | +3 % |
| Sentry error tracking | +3 % |
| Design system premium (glassmorphisme) | +6 % |
| RBAC granulaire (5 rôles, 11 permissions) | +4 % |
| KYC complet (selfie, magic bytes) | +5 % |
| Distribution signaux temps réel (BullMQ/WS) | +6 % |
| Audit logs intègres | +3 % |
| **Malus (–)** | **–15 %** |
| Mono-langue FR | –3 % |
| Pas de tests E2E | –4 % |
| Docs externes minimales | –3 % |
| Dette technique mineure | –2 % |
| Single-tenant | –3 % |
| **Net** | **+58 %** |

### 💎 Valeur finale pondérée

| Scénario | Base | +58 % bonus | **Total** |
|----------|------|-------------|-----------|
| **A. Freelance Afrique senior** | 10 680 000 FCFA | +6 194 400 | **16 874 400 FCFA** |
| **B. Freelance Europe senior** | 62 300 € | +36 134 € | **98 434 €** |
| **C. Agence Europe** | 100 000 € | +58 000 € | **158 000 €** |
| **D. Startup US** | 100 000 $ | +58 000 $ | **158 000 $** |

### 🎯 Fourchette recommandée pour pitch

| Devise | Fourchette | Médiane |
|--------|------------|---------|
| **FCFA** | **15 000 000 – 22 000 000 FCFA** | **≈ 18 500 000 FCFA** |
| **€** | 22 000 – 33 000 € | ≈ 27 500 € |
| **$** | 24 000 – 36 000 $ | ≈ 30 000 $ |

> 💡 **Lecture investisseur** : 18,5M FCFA est le **coût de remplacement** à tarif senior Afrique. La même prestation facturée en agence Europe vaut **100–158k€**. La qualité production (0 CVE, 8 releases, multi-VPS, conformité accessibilité) justifie un prix catalogue de **150–200k€** pour un repreneur exigeant.

---

## 📌 Ce que prouve cette valorisation

- ✅ **Travail réel traçable** : chaque jour-homme est justifié par commits horodatés, pas une estimation au doigt mouillé.
- ✅ **Qualité production** : 0 vulnérabilité, CSP nonce dynamique, rate-limiting, audit logs hachés, multi-VPS avec rollback auto.
- ✅ **Vélocité fondateur** : 1,33× de productivité, 47 % de commits le week-end — profil owner-operator.
- ✅ **Actif tangible** : 157k LOC + 29 models + 603 fichiers + 53 fichiers infra = actif cessible et assurable.

---

## 🎤 Phrase pitch à réutiliser

> *« Ce projet représente l'équivalent de **89 jours-homme** de développement senior, soit **4,5 mois** à temps plein, réalisé en 67 jours. Il est équivalent à une prestation d'agence européenne facturée entre **100 000 € et 158 000 €**, ou à un travail de freelance senior africain valorisé à **18,5 millions FCFA**. La qualité production justifie une valorisation catalogue de 150 000–200 000 €. »*

---

*Source : `estimation-valeur.md` du 3 septembre 2026 — analyse git (913 commits, 786 non-merge), volumétrie LOC, paramètres qualité.*
